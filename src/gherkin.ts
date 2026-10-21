import { AstBuilder, compile, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { GherkinDocument, IdGenerator, Pickle } from '@cucumber/messages';

/** Parses a .feature file. Syntax errors name the file and line. */
export function parseGherkin(source: string, file: string): GherkinDocument {
  const newId = IdGenerator.incrementing();
  const parser = new Parser(new AstBuilder(newId), new GherkinClassicTokenMatcher());
  try {
    return parser.parse(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Gherkin messages look like "Parser errors:\n(3:5): expected: ...". Keep the located
    // lines, in words, and prefix them with the file name.
    const located: string[] = [];
    let previous: string | undefined;
    for (const line of message.split('\n')) {
      const match = /^\((\d+):(\d+)\): (.*)$/.exec(line);
      if (!match) continue;
      const { kind, text } = readableSyntaxError(match[3]);
      // The parser repeats an error on every line after it, e.g. without "Feature:".
      if (kind && kind === previous) continue;
      previous = kind;
      located.push(`${file}:${match[1]}:${match[2]}: ${text}`);
    }
    throw new Error(located.length ? located.join('\n') : `${file}: ${message}`);
  }
}

/** What Gherkin's tokens stand for, in words. */
const TOKENS: Record<string, string> = {
  EOF: 'the end of the file',
  Language: '"# language:"',
  TagLine: 'a tag such as @smoke',
  FeatureLine: '"Feature:"',
  BackgroundLine: '"Background:"',
  RuleLine: '"Rule:"',
  ScenarioLine: '"Scenario:"',
  ExamplesLine: '"Examples:"',
  StepLine: 'a step (* …)',
  TableRow: 'a table row (| … |)',
  DocStringSeparator: '"""',
  Other: 'text',
};

/**
 * A message of Gherkin's parser in words, for people who write tests:
 * `expected: #EOF, #TableRow, #StepLine, …, got 'Click Save'` → `"Click Save" is not a step. …`
 */
export function readableSyntaxError(message: string): { kind?: string; text: string } {
  if (message.startsWith('inconsistent cell count')) {
    return { text: 'This table row has a different number of cells than the first row.' };
  }
  const match = /^(unexpected end of file, )?expected: (.*?)(?:, got '(.*)')?$/.exec(message);
  if (!match) return { text: message };
  const [, end, list, got] = match;
  const expected = list.split(', ').map((token) => token.replace(/^#/, ''));
  const not = got === undefined ? '' : `, not "${got.trim()}"`;
  if (expected.includes('FeatureLine')) {
    return {
      kind: 'feature',
      text: `A feature file starts with a "Feature:" line, after tags and comments${not}.`,
    };
  }
  if (end && expected.includes('DocStringSeparator')) {
    return { text: 'A doc string has no closing """. Add a line with """ after its text.' };
  }
  if (got?.trim().startsWith('Background:')) {
    return { text: '"Background:" comes before the first "Scenario:", once per feature or rule.' };
  }
  if (got !== undefined && expected.includes('StepLine')) {
    return {
      kind: 'step',
      text:
        `"${got.trim()}" is not a step: steps start with * (or Given, When, Then). Other text ` +
        'goes right below the "Feature:" or "Scenario:" line, or after # as a comment.',
    };
  }
  if (expected.includes('TagLine') && !expected.includes('StepLine')) {
    return {
      kind: 'tag',
      text: `A tag belongs on the line above "Feature:", "Scenario:", "Rule:" or "Examples:"${not}.`,
    };
  }
  const words = expected
    .filter((token) => token !== 'Comment' && token !== 'Empty')
    .map((token) => TOKENS[token] ?? token);
  const found = got === undefined ? 'the end of the file' : `"${got.trim()}"`;
  return {
    text: `Gherkin cannot read ${found} here. It expects ${words.slice(0, -1).join(', ')}${words.length > 1 ? ' or ' : ''}${words.at(-1)}.`,
  };
}

export type FeatureStep = {
  text: string;
  line: number;
  column: number;
  /** Tags of the scenario the step runs in, including inherited ones. */
  tags: string[];
};

/**
 * Step texts as they run, with Scenario Outline placeholders filled in, the line of the step
 * in the file and the scenario's tags. A step in an outline appears once per distinct text.
 */
export function featureSteps(document: GherkinDocument, file: string): FeatureStep[] {
  const pickles: readonly Pickle[] = compile(document, file, IdGenerator.incrementing());
  const locations = new Map<string, { line: number; column: number }>();
  const visit = (steps: readonly { id: string; location: { line: number; column?: number } }[]) =>
    steps.forEach((s) =>
      locations.set(s.id, { line: s.location.line, column: s.location.column ?? 1 }),
    );
  for (const child of document.feature?.children ?? []) {
    if (child.background) visit(child.background.steps);
    if (child.scenario) visit(child.scenario.steps);
    for (const ruleChild of child.rule?.children ?? []) {
      if (ruleChild.background) visit(ruleChild.background.steps);
      if (ruleChild.scenario) visit(ruleChild.scenario.steps);
    }
  }
  const seen = new Set<string>();
  const result: FeatureStep[] = [];
  for (const pickle of pickles) {
    const tags = pickle.tags.map((tag) => tag.name);
    for (const step of pickle.steps) {
      const location = locations.get(step.astNodeIds[0]);
      if (!location) continue;
      const key = `${location.line}\u0000${step.text}\u0000${tags.join(' ')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ text: step.text, ...location, tags });
    }
  }
  return result.sort((a, b) => a.line - b.line);
}
