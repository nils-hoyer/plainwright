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

const FIXED_WAIT =
  'Check for what the user waits for instead, such as I see the text "…": every check waits by itself. For a slow page: I see the "…" heading within "30" seconds.';
const POSITION =
  'A position breaks when the layout changes, and a reviewer cannot tell what is there. For a canvas, a map or a signature pad, write a step in TypeScript (docs/writing-steps.md).';
const COORDINATES = `Name the element instead: I click the "…" button. ${POSITION}`;
const MOUSE_BUTTON =
  'Drag with I drag the "…" list item to the "…" list. For drawing, write a step in TypeScript (docs/writing-steps.md).';
const HOLD_KEY =
  'Press a key or a combination with I press "Shift+A", or I press "…" in the "…" field. To hold a key while doing something else, write a step in TypeScript (docs/writing-steps.md).';
const SCROLL_BY =
  'Scroll to what you need instead: I scroll to the "…" section, or to the bottom of the page. Clicks and checks scroll by themselves.';
const PAGE_LOAD =
  'Opening a page and clicking already wait for it. Check for what the user waits for instead, such as I see the "…" heading.';

/**
 * Built-in steps that were removed, with what to write instead. lint, keywords and runs name the
 * replacement for a step that matches one, instead of only "unknown step". The step reference
 * lists them, and the release notes copy that list.
 */
export const REMOVED_STEPS: readonly RemovedStep[] = [
  { pattern: 'I wait {number} second(s)', removedIn: '0.3.0', instead: FIXED_WAIT },
  { pattern: 'I wait {number} millisecond(s)', removedIn: '0.3.0', instead: FIXED_WAIT },
  { pattern: 'I wait for the page to load', removedIn: '0.3.0', instead: PAGE_LOAD },
  { pattern: 'I wait for network idle', removedIn: '0.3.0', instead: PAGE_LOAD },
  {
    pattern: 'I type {string} on the keyboard',
    removedIn: '0.3.0',
    instead:
      'Name the field: I type "…" in the "…" field, which also presses the keys one by one. To replace its content, I fill "…" in the "…" field.',
  },
  { pattern: 'I hold down the key {string}', removedIn: '0.3.0', instead: HOLD_KEY },
  { pattern: 'I release the key {string}', removedIn: '0.3.0', instead: HOLD_KEY },
  {
    pattern: 'I insert the text {string}',
    removedIn: '0.3.0',
    instead: 'Name the field: I fill "…" in the "…" field.',
  },
  { pattern: 'I click at x {number} y {number}', removedIn: '0.3.0', instead: COORDINATES },
  { pattern: 'I double click at x {number} y {number}', removedIn: '0.3.0', instead: COORDINATES },
  { pattern: 'I right click at x {number} y {number}', removedIn: '0.3.0', instead: COORDINATES },
  {
    pattern: 'I move the mouse to x {number} y {number}',
    removedIn: '0.3.0',
    instead: `Name the element instead: I hover over the "…" link. ${POSITION}`,
  },
  { pattern: 'I press the mouse button', removedIn: '0.3.0', instead: MOUSE_BUTTON },
  { pattern: 'I press the {string} mouse button', removedIn: '0.3.0', instead: MOUSE_BUTTON },
  { pattern: 'I release the mouse button', removedIn: '0.3.0', instead: MOUSE_BUTTON },
  {
    pattern: 'I scroll the mouse wheel by x {number} y {number}',
    removedIn: '0.3.0',
    instead: SCROLL_BY,
  },
  {
    pattern: 'I tap at x {number} y {number}',
    removedIn: '0.3.0',
    instead: `Name the element instead: I tap the "…" button. ${POSITION}`,
  },
  { pattern: 'I scroll down by {number} pixels', removedIn: '0.3.0', instead: SCROLL_BY },
  { pattern: 'I scroll up by {number} pixels', removedIn: '0.3.0', instead: SCROLL_BY },
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

/** `"I wait "2" seconds" was removed in 0.3.0. Check for …`, or undefined for other steps. */
export function removedMessage(text: string, removed = removedStep(text)): string | undefined {
  return removed && `"${text}" was removed in ${removed.removedIn}. ${removed.instead}`;
}
