import { CucumberExpression } from '@cucumber/cucumber-expressions';
import { parameterTypes } from './params';

export type RemovedStep = {
  /** The pattern the step had. */
  pattern: string;
  /** The version that removed it. */
  removedIn: string;
  /** What to write instead, and why, in one or two sentences. */
  instead: string;
};

const MILLISECONDS =
  'Check for what the user waits for instead, such as I see the text "…": every check waits by itself. Where a fixed wait cannot be avoided: I wait "0.5" seconds.';
const PAGE_LOAD =
  'Opening a page and clicking already wait for it. Check for what the user waits for instead, such as I see the "…" heading.';

/**
 * Built-in steps that were removed, with what to write instead. lint, keywords and runs name the
 * replacement for a step that matches one, instead of only "unknown step". The step reference
 * lists them, and the release notes copy that list.
 */
export const REMOVED_STEPS: readonly RemovedStep[] = [
  { pattern: 'I wait {number} millisecond(s)', removedIn: '0.3.0', instead: MILLISECONDS },
  { pattern: 'I wait for the page to load', removedIn: '0.3.0', instead: PAGE_LOAD },
  { pattern: 'I wait for network idle', removedIn: '0.3.0', instead: PAGE_LOAD },
];

const expressions = new Map<RemovedStep, CucumberExpression>();

/** The removed step the text matches, if any. */
export function removedStep(text: string): RemovedStep | undefined {
  return REMOVED_STEPS.find((removed) => {
    let expression = expressions.get(removed);
    if (!expression) {
      expression = new CucumberExpression(removed.pattern, parameterTypes);
      expressions.set(removed, expression);
    }
    return expression.match(text) !== null;
  });
}

/** `"I wait "500" milliseconds" was removed in 0.3.0. Check for …`, or undefined for other steps. */
export function removedMessage(text: string, removed = removedStep(text)): string | undefined {
  return removed && `"${text}" was removed in ${removed.removedIn}. ${removed.instead}`;
}
