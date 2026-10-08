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
    // lines and prefix them with the file name.
    const located = message
      .split('\n')
      .filter((line) => /^\(\d+:\d+\): /.test(line))
      .map((line) => line.replace(/^\((\d+):(\d+)\): /, `${file}:$1:$2: `));
    throw new Error(located.length ? located.join('\n') : `${file}: ${message}`);
  }
}

export type FeatureStep = { text: string; line: number; column: number };

/**
 * Step texts as they run, with Scenario Outline placeholders filled in, and the line of the
 * step in the file. A step in an outline appears once per distinct text.
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
    for (const step of pickle.steps) {
      const location = locations.get(step.astNodeIds[0]);
      if (!location) continue;
      const key = `${location.line}\u0000${step.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ text: step.text, ...location });
    }
  }
  return result.sort((a, b) => a.line - b.line);
}
