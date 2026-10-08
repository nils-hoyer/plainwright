import fs from 'node:fs';
import path from 'node:path';
import { featureSteps, parseGherkin } from './gherkin';
import { validateKeywords } from './keywords';
import { findSteps, getSteps, suggestSteps } from './registry';

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
    | 'step-example';
  message: string;
};

// Values that look like CSS, XPath or Playwright selectors rather than visible names.
const SELECTOR =
  /^(?:[#.][a-z_-]|\[[a-z_-]|\/\/|\.\/\/|(?:css|xpath|text|role|id|data-testid|internal:\w+)=)|>>|\[data-[\w-]+/i;
const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Checks feature files against the registered steps. Also checks loaded keywords and that
 * every step example matches its own step.
 */
export function lintFeatures(files: string[], cwd = process.cwd()): LintMessage[] {
  const messages: LintMessage[] = [];
  const reported = new Set<string>();
  for (const absolute of files) {
    const file = path.relative(cwd, absolute) || absolute;
    let steps;
    try {
      steps = featureSteps(parseGherkin(fs.readFileSync(absolute, 'utf8'), file), file);
    } catch (error) {
      messages.push(...fromLocatedErrors(String((error as Error).message), 'syntax', file));
      continue;
    }
    for (const { text, line } of steps) {
      // A step in a Scenario Outline runs once per example; report each problem once.
      const add = (severity: LintSeverity, rule: LintMessage['rule'], message: string) => {
        const key = `${file}:${line}:${rule}:${message}`;
        if (reported.has(key)) return;
        reported.add(key);
        messages.push({ file, line, severity, rule, message });
      };

      for (const value of quotedValues(text)) {
        if (SELECTOR.test(value)) {
          add(
            'error',
            'selector',
            `"${value}" looks like a selector. Name the element by what the user sees, or add an alias with definePage().`,
          );
        } else if (ABSOLUTE_URL.test(value)) {
          add(
            'error',
            'absolute-url',
            `"${value}" is an absolute URL. Use a page name (I open the "..." page) or a URL relative to baseURL.`,
          );
        }
      }

      const matches = findSteps(text);
      if (matches.length === 0) {
        const suggestion = suggestSteps(text)[0];
        add(
          'error',
          'undefined-step',
          `Unknown step "${text}".` + (suggestion ? ` Did you mean "${suggestion.example}"?` : ''),
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
      const { step } = matches[0];
      if (step.discouraged) add('warning', 'discouraged-step', step.discouraged);
      if (step.level === 'advanced') {
        add('info', 'advanced-step', `"${step.pattern}" is an advanced step.`);
      }
    }
  }

  for (const error of validateKeywords()) {
    messages.push(...fromLocatedErrors(error, 'keyword', ''));
  }

  for (const step of getSteps()) {
    const matches = findSteps(step.example);
    if (matches.length === 1 && matches[0].step === step) continue;
    messages.push({
      file: step.location ? path.relative(cwd, step.location.file) : '',
      line: step.location?.line ?? 0,
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

function quotedValues(text: string): string[] {
  return [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((match) =>
    match[1].replace(/\\(.)/g, '$1'),
  );
}

/** Turns "file:line: message" lines into lint messages. */
function fromLocatedErrors(
  text: string,
  rule: LintMessage['rule'],
  fallbackFile: string,
): LintMessage[] {
  return text
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('[playwright-keywords]'))
    .map((line) => {
      const match = /^(.+?):(\d+)(?::\d+)?: (.*)$/.exec(line);
      return {
        file: match ? match[1] : fallbackFile,
        line: match ? Number(match[2]) : 0,
        severity: 'error' as const,
        rule,
        message: match ? match[3] : line,
      };
    });
}
