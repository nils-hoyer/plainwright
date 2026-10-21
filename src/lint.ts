import fs from 'node:fs';
import path from 'node:path';
import { featureSteps, parseGherkin } from './gherkin';
import { ElementRef } from './elements';
import { checkKeywords, fillPlaceholders, keywordOf } from './keywords';
import { getPageDefinitions } from './pages';
import {
  findSteps,
  getSteps,
  getUnusableSteps,
  StepDefinition,
  suggestionFor,
  suggestSteps,
} from './registry';
import { rememberedName } from './steps/builtin';
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
    | 'unknown-value'
    | 'remember-name';
  message: string;
};

// Values that look like CSS, XPath or Playwright selectors rather than visible names.
const SELECTOR =
  /^(?:[#.][a-z_-]|\[[a-z_-]|\/\/|\.\/\/|(?:css|xpath|text|role|id|data-testid|internal:\w+)=)|>>|\[data-[\w-]+/i;
const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const OPEN_URL = 'I open the url {string}';
const PAGE_STEPS = [
  'I open the {string} page',
  'I am on the {string} page',
  'I use the page object {string}',
];

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
  for (const absolute of files) {
    const file = path.relative(cwd, absolute) || absolute;
    let steps;
    try {
      steps = featureSteps(parseGherkin(fs.readFileSync(absolute, 'utf8'), file), file);
    } catch (error) {
      messages.push(...fromLocatedErrors(String((error as Error).message), 'syntax', file));
      continue;
    }
    // Names that steps in this file remember, also inside keywords, for {name} references.
    const remembered = new Set(steps.flatMap(({ text, tags }) => rememberedNames(text, tags)));
    for (const { text, line, tags } of steps) {
      // A step in a Scenario Outline runs once per example; report each problem once.
      const add = (severity: LintSeverity, rule: LintMessage['rule'], message: string) => {
        const key = `${file}:${line}:${rule}:${message}`;
        if (reported.has(key)) return;
        reported.add(key);
        messages.push({ file, line, severity, rule, message });
      };

      const matches = findSteps(text, tags);
      if (matches.length === 0) {
        const elsewhere = findSteps(text);
        if (elsewhere.length) {
          const needed = [...new Set(elsewhere.map(({ step }) => step.tags.join(' and ')))];
          add(
            'error',
            'undefined-step',
            `"${text}" only applies to scenarios tagged ${needed.join(' or ')}, the folder of its step file.`,
          );
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
      if (matches.length > 1) {
        add(
          'error',
          'ambiguous-step',
          `"${text}" matches ${matches.length} steps: ${matches.map((m) => `"${m.step.pattern}"`).join(', ')}.`,
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
      if (PAGE_STEPS.includes(step.pattern)) {
        const name = String(args[0]);
        const pages = getPageDefinitions().map((page) => page.name);
        if (!referencesIn(name).length && !pages.includes(name)) {
          add(
            'error',
            'unknown-page',
            `No page named "${name}". ` +
              (pages.length
                ? `Defined pages: ${pages.map((page) => `"${page}"`).join(', ')}.`
                : 'Add it as a file in pages/, or open the address with I open the url "/...".'),
          );
        }
      }
      for (const reference of new Set(valueTexts(args).flatMap(referencesIn))) {
        const problem = checkReference(reference, remembered);
        if (problem) add('error', 'unknown-value', problem);
      }
      const name = rememberedName(step, args);
      if (name !== undefined && !referencesIn(name).length) {
        const problem = checkRememberName(name);
        if (problem) add('error', 'remember-name', problem);
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
    if (unusable.some((entry) => entry.step === step)) continue;
    const matches = findSteps(step.example, step.tags);
    if (matches.length === 1 && matches[0].step === step) continue;
    messages.push({
      ...stepLocation(step, cwd),
      severity: 'error',
      rule: 'step-example',
      message: matches.some((m) => m.step === step)
        ? `The example "${step.example}" of "${step.pattern}" also matches ${matches
            .filter((m) => m.step !== step)
            .map((m) => `"${m.step.pattern}"`)
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

function stepLocation(step: StepDefinition, cwd: string) {
  return {
    file: step.location ? path.relative(cwd, step.location.file) : '',
    line: step.location?.line ?? 0,
  };
}

/** The names a step remembers values under, including the steps of a keyword it calls. */
function rememberedNames(text: string, tags?: readonly string[], depth = 0): string[] {
  const matches = findSteps(text, tags);
  if (matches.length !== 1 || depth > 20) return [];
  const { step, args } = matches[0];
  const name = rememberedName(step, args);
  if (name !== undefined) return [name];
  const keyword = keywordOf(step);
  if (!keyword) return [];
  const values = Object.fromEntries(keyword.params.map((param, i) => [param, String(args[i])]));
  return keyword.steps.flatMap((sub) =>
    rememberedNames(fillPlaceholders(sub.text, values), undefined, depth + 1),
  );
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
