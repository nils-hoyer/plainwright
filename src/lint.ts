import fs from 'node:fs';
import path from 'node:path';
import { FeatureStep, featureSteps, parseGherkin, scenarioSteps } from './gherkin';
import { ElementRef } from './elements';
import { checkKeywords, fillPlaceholders, getKeywords, keywordOf, sameWording } from './keywords';
import { appPagesFile, getPageDefinitions, isUrlPattern } from './pages';
import {
  findSteps,
  getSteps,
  getUnusableSteps,
  onlyForTagsMessage,
  rememberedName,
  StepDefinition,
  StepMatch,
  suggestionFor,
  suggestSteps,
} from './registry';
import { checkSessionTag, SETUP_STEPS, SETUP_TAG } from './session';
import { checkReference, checkRememberName, NumberReference, referencesIn } from './values';

export type LintSeverity = 'error' | 'warning' | 'info';

export type LintMessage = {
  file: string;
  line: number;
  severity: LintSeverity;
  rule:
    | 'syntax'
    | 'undefined-step'
    | 'ambiguous-step'
    | 'selector'
    | 'absolute-url'
    | 'discouraged-step'
    | 'advanced-step'
    | 'keyword'
    | 'step-example'
    | 'unknown-parameter-type'
    | 'unknown-page'
    | 'page-address'
    | 'unknown-value'
    | 'remember-name'
    | 'setup-step';
  message: string;
};

// Values that look like CSS, XPath or Playwright selectors rather than visible names.
const SELECTOR =
  /^(?:[#.][a-z_-]|\[[a-z_-]|\/\/|\.\/\/|(?:css|xpath|text|role|id|data-testid|internal:\w+)=)|>>|\[data-[\w-]+/i;
const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const OPEN_URL = 'I open the url {string}';
const OPEN_PAGE = 'I open the {string} page';
const CHECK_PAGE = 'I am on the {string} page';
const PAGE_STEPS = [OPEN_PAGE, CHECK_PAGE, 'I use the page object {string}'];

/**
 * Checks feature files against the registered steps. Also checks loaded keywords and that
 * every step example matches its own step.
 */
export function lintFeatures(files: string[], cwd = process.cwd()): LintMessage[] {
  const messages: LintMessage[] = [];
  const reported = new Set<string>();
  const unusable = getUnusableSteps();
  const skippedHint = unusable.length
    ? ` Lint skips ${unusable.length} step(s) with an unknown parameter type; see the warnings.`
    : '';
  // A keyword worded like another step is reported once, at the keyword. A step that matches
  // both counts as the other step, so one keyword does not cause an error in every test.
  const colliding = new Set(
    getKeywords()
      .filter((keyword) => sameWording(keyword).length)
      .map((keyword) => keyword.step),
  );
  const find = (text: string, tags?: readonly string[]) =>
    withoutColliding(findSteps(text, tags), colliding);
  for (const absolute of files) {
    const file = path.relative(cwd, absolute) || absolute;
    let steps: FeatureStep[];
    let scenarios: FeatureStep[][];
    try {
      const document = parseGherkin(fs.readFileSync(absolute, 'utf8'), file);
      steps = featureSteps(document, file);
      scenarios = scenarioSteps(document, file);
    } catch (error) {
      messages.push(...fromLocatedErrors(String((error as Error).message), 'syntax', file));
      continue;
    }
    const remembered = rememberedInOrder(scenarios, (step) =>
      rememberedNames(find, step.text, step.tags),
    );
    for (const { text, line, tags } of steps) {
      // A step in a Scenario Outline runs once per example; report each problem once.
      const add = (severity: LintSeverity, rule: LintMessage['rule'], message: string) => {
        const key = `${file}:${line}:${rule}:${message}`;
        if (reported.has(key)) return;
        reported.add(key);
        messages.push({ file, line, severity, rule, message });
      };

      const matches = find(text, tags);
      if (matches.length === 0) {
        const elsewhere = findSteps(text);
        if (elsewhere.length) {
          const needed = [...new Set(elsewhere.map(({ step }) => step.tags.join(' and ')))];
          add('error', 'undefined-step', onlyForTagsMessage(text, needed.join(' or ')));
          continue;
        }
        const suggestion = suggestSteps(text)[0];
        add(
          'error',
          'undefined-step',
          `Unknown step "${text}".` +
            (suggestion ? ` Did you mean "${suggestionFor(suggestion, text)}"?` : '') +
            skippedHint,
        );
        continue;
      }
      // playwright-bdd applies the tags of step folders only to scenarios that have tags, so in
      // a scenario without any, it also counts the steps of tag folders.
      const counted = tags.length ? matches : find(text);
      if (counted.length > 1) {
        add(
          'error',
          'ambiguous-step',
          `"${text}" matches ${counted.length} steps: ${counted.map((m) => named(m.step, cwd)).join(', ')}.` +
            (counted.length > matches.length
              ? ' In a scenario without tags, the steps in tag folders count too.'
              : ''),
        );
        continue;
      }
      const { step, args } = matches[0];
      // Only element names and addresses to open; other values are data, such as ".NET".
      for (const name of elementNames(args)) {
        if (SELECTOR.test(name)) {
          add(
            'error',
            'selector',
            `"${name}" looks like a selector. Name the element by what the user sees, or add an alias in the page's file in pages/.`,
          );
        }
      }
      if (step.pattern === OPEN_URL && ABSOLUTE_URL.test(String(args[0]))) {
        add(
          'error',
          'absolute-url',
          `"${args[0]}" is an absolute URL. Use a page name (I open the "..." page) or a URL relative to baseURL.`,
        );
      }
      if (PAGE_STEPS.includes(step.pattern) && !referencesIn(String(args[0])).length) {
        const name = String(args[0]);
        const pages = getPageDefinitions();
        const page = pages.find((p) => p.name === name);
        if (!page) {
          const app = appPagesFile(cwd);
          add(
            'error',
            'unknown-page',
            `No page named "${name}". ` +
              (pages.length
                ? `Defined pages: ${pages.map((p) => `"${p.name}"`).join(', ')}.`
                : app
                  ? `pages/ holds your app's files (${app}), so Plainwright loads no pages from it. Open the address with I open the url "/...".`
                  : 'Add it as a file in pages/, or open the address with I open the url "/...".'),
          );
        } else if (step.pattern === OPEN_PAGE && (!page.url || isUrlPattern(page.url))) {
          add(
            'error',
            'page-address',
            page.url
              ? `The page "${name}" has the address pattern ${page.url}, which can only be checked (I am on the "${name}" page). Open it with I open the url "/...".`
              : `The page "${name}" has no address to open. Add its "url".`,
          );
        } else if (step.pattern === CHECK_PAGE && !page.url) {
          add(
            'error',
            'page-address',
            `The page "${name}" has no address to check. Add its "url".`,
          );
        }
      }
      const order = remembered.of({ text, line, tags });
      for (const reference of new Set(valueTexts(args).flatMap(referencesIn))) {
        const problem = checkReference(reference, order.before);
        if (problem) add('error', 'unknown-value', order.explain(reference) ?? problem);
        // CI often sets secrets only for the test run, so this is a warning.
        const variable = /^env\.(.+)$/.exec(reference)?.[1];
        if (variable && process.env[variable] === undefined) {
          add(
            'warning',
            'unknown-value',
            `The environment variable ${variable} is not set. Set it, or add it to the .env file, before the tests run.`,
          );
        }
      }
      const name = rememberedName(step, args);
      if (name !== undefined && !referencesIn(name).length) {
        const problem = checkRememberName(name);
        if (problem) add('error', 'remember-name', problem);
      }
      if (SETUP_STEPS.includes(step.pattern) && !tags.includes(SETUP_TAG)) {
        add(
          'error',
          'setup-step',
          `"${text}" only works in a scenario tagged ${SETUP_TAG}, which runs before the others when the configuration has setup: true.`,
        );
      }
      if (step.pattern === SETUP_STEPS[1] && !referencesIn(String(args[0])).length) {
        const problem = checkSessionTag(String(args[0]));
        if (problem) add('error', 'setup-step', problem);
      }
      if (step.discouraged) add('warning', 'discouraged-step', step.discouraged);
      if (step.level === 'advanced') {
        add('info', 'advanced-step', `"${step.pattern}" is an advanced step.`);
      }
    }
  }

  const keywordProblems = checkKeywords();
  for (const error of keywordProblems.errors) {
    messages.push(...fromLocatedErrors(error, 'keyword', ''));
  }
  for (const warning of keywordProblems.warnings) {
    messages.push(...fromLocatedErrors(warning, 'keyword', '', 'warning'));
  }

  for (const { step, message } of unusable) {
    messages.push({
      ...stepLocation(step, cwd),
      severity: 'warning',
      rule: 'unknown-parameter-type',
      message,
    });
  }

  for (const step of getSteps()) {
    if (unusable.some((entry) => entry.step === step) || colliding.has(step)) continue;
    const matches = find(step.example, step.tags);
    if (matches.length === 1 && matches[0].step === step) continue;
    const others = matches.map((m) => m.step).filter((other) => other !== step);
    // A built-in step has no file to point to: the cause is a step in the project.
    const causes = others.filter((other) => other.location);
    if (!step.location && causes.length && others.length < matches.length) {
      for (const other of causes) {
        // Reported with the example of the other step already.
        if (find(other.example, other.tags).some((m) => m.step === step)) continue;
        messages.push({
          ...stepLocation(other, cwd),
          severity: 'error',
          rule: 'step-example',
          message: `"${other.pattern}" also matches "${step.example}", the example of the ${step.source} step "${step.pattern}". Word it differently.`,
        });
      }
      continue;
    }
    messages.push({
      ...stepLocation(step, cwd),
      severity: 'error',
      rule: 'step-example',
      message:
        others.length < matches.length
          ? `The example "${step.example}" of "${step.pattern}" also matches ${others
              .map((other) => `"${other.pattern}"`)
              .join(', ')}.`
          : `The example "${step.example}" does not match its own step "${step.pattern}".`,
    });
  }

  return messages;
}

/** `test/login.feature:12: error: Unknown step "..." (undefined-step)` */
export function formatLintMessage(message: LintMessage): string {
  const where = message.file ? `${message.file}:${message.line}: ` : '';
  return `${where}${message.severity}: ${message.message} (${message.rule})`;
}

export function summarize(messages: LintMessage[]): string {
  const count = (severity: LintSeverity) => messages.filter((m) => m.severity === severity).length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return `${plural(count('error'), 'error')}, ${plural(count('warning'), 'warning')}, ${count('info')} info`;
}

/** `"I open the start page" (steps/@admin/start.ts:3)` */
function named(step: StepDefinition, cwd: string) {
  const { file, line } = stepLocation(step, cwd);
  return `"${step.pattern}"${file ? ` (${file}:${line})` : ''}`;
}

function stepLocation(step: StepDefinition, cwd: string) {
  return {
    file: step.location ? path.relative(cwd, step.location.file) : '',
    line: step.location?.line ?? 0,
  };
}

/** Of several matches, those that are not a keyword worded like another step, if any. */
function withoutColliding(matches: StepMatch[], colliding: ReadonlySet<StepDefinition>) {
  const others = matches.filter(({ step }) => !colliding.has(step));
  return others.length ? others : matches;
}

/** The names a step remembers values under, including the steps of a keyword it calls. */
function rememberedNames(
  find: (text: string, tags?: readonly string[]) => StepMatch[],
  text: string,
  tags?: readonly string[],
  depth = 0,
): string[] {
  const matches = find(text, tags);
  if (matches.length !== 1 || depth > 20) return [];
  const { step, args } = matches[0];
  const name = rememberedName(step, args);
  if (name !== undefined) return [name];
  const keyword = keywordOf(step);
  if (!keyword) return [];
  const values = Object.fromEntries(keyword.params.map((param, i) => [param, String(args[i])]));
  return keyword.steps.flatMap((sub) =>
    rememberedNames(find, fillPlaceholders(sub.text, values), undefined, depth + 1),
  );
}

/**
 * For each step, the names remembered before it in its scenario, also inside keywords, and why
 * a name is not among them: remembered later, or only in another scenario. Values last for one
 * test, so a name remembered anywhere else is not there when the step runs.
 */
function rememberedInOrder(scenarios: FeatureStep[][], namesOf: (step: FeatureStep) => string[]) {
  const key = ({ line, text, tags }: Pick<FeatureStep, 'line' | 'text' | 'tags'>) =>
    `${line}\u0000${text}\u0000${tags.join(' ')}`;
  /** The first line that remembers a name, in the whole file. */
  const anywhere = new Map<string, number>();
  const orders = new Map<string, { before: Set<string>; later: Map<string, number> }>();
  for (const scenario of scenarios) {
    const names = scenario.map(namesOf);
    scenario.forEach((step, i) => {
      for (const name of names[i]) if (!anywhere.has(name)) anywhere.set(name, step.line);
      const before = new Set(names.slice(0, i).flat());
      const later = new Map<string, number>();
      for (let j = scenario.length - 1; j >= i; j--) {
        for (const name of names[j]) later.set(name, scenario[j].line);
      }
      // A Background step runs in every scenario, an outline step once per example: a name
      // counts only when it is remembered before the step in each of them.
      const known = orders.get(key(step));
      if (!known) {
        orders.set(key(step), { before, later });
        return;
      }
      for (const name of known.before) if (!before.has(name)) known.before.delete(name);
      for (const [name, line] of later) if (!known.later.has(name)) known.later.set(name, line);
    });
  }
  return {
    of(step: Pick<FeatureStep, 'line' | 'text' | 'tags'>) {
      const { before, later } = orders.get(key(step)) ?? {
        before: new Set<string>(),
        later: new Map(),
      };
      return {
        before: before as ReadonlySet<string>,
        explain(reference: string): string | undefined {
          const [name] = reference.split('.');
          if (later.has(name)) {
            return `{${name}} is remembered later, in line ${later.get(name)}. Remember it before using it.`;
          }
          if (anywhere.has(name)) {
            return (
              `{${name}} is only remembered in another scenario (line ${anywhere.get(name)}). ` +
              'Remembered values last for one test: remember it in this scenario, or put it into a file in data/.'
            );
          }
          return undefined;
        },
      };
    },
  };
}

/** The quoted values of a step as written: texts, element names and numbers. */
function valueTexts(args: unknown[]): string[] {
  return args.flatMap((arg) => {
    if (typeof arg === 'string') return [arg];
    if (arg instanceof NumberReference) return [arg.text];
    return elementNames([arg]);
  });
}

/** Names of element parameters and the elements they are in. */
function elementNames(args: unknown[]): string[] {
  const names: string[] = [];
  for (const arg of args) {
    for (let ref = arg instanceof ElementRef ? arg : undefined; ref; ref = ref.container) {
      names.push(ref.name);
    }
  }
  return names;
}

/** Turns "file:line: message" lines into lint messages. */
function fromLocatedErrors(
  text: string,
  rule: LintMessage['rule'],
  fallbackFile: string,
  severity: LintSeverity = 'error',
): LintMessage[] {
  return text
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('[plainwright]'))
    .map((line) => {
      const match = /^(.+?):(\d+)(?::\d+)?: (.*)$/.exec(line);
      return {
        file: match ? match[1] : fallbackFile,
        line: match ? Number(match[2]) : 0,
        severity,
        rule,
        message: match ? match[3] : line,
      };
    });
}
