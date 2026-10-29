import { CucumberExpression } from '@cucumber/cucumber-expressions';
import { parameterTypes } from './params';

export type LeftOutStep = {
  /** How the step is worded, as people coming from other tools write it. */
  pattern: string;
  /** What to write instead, and why, in one or two sentences. Steps in it are in backticks. */
  instead: string;
  /** Also matches numbers without quotes, as other tools write positions: I click at x 10 y 20. */
  bareNumbers?: boolean;
};

const MILLISECONDS =
  'Check for what the user waits for instead, such as `I see the text "…"`: every check waits by itself. Where a fixed wait cannot be avoided: `I wait "0.5" seconds`.';
const POSITION =
  'A position breaks when the layout changes, and a reviewer cannot tell what is there. For a canvas, a map or a signature pad, write a step in TypeScript (docs/writing-steps.md).';
const COORDINATES = `Name the element instead: \`I click the "…" button\`. ${POSITION}`;
const MOUSE_BUTTON =
  'Drag with `I drag the "…" list item to the "…" list`. For drawing, write a step in TypeScript (docs/writing-steps.md).';
const HOLD_KEY =
  'Press a key or a combination with `I press "Shift+A"`, or `I press "…" in the "…" field`. To hold a key while doing something else, write a step in TypeScript (docs/writing-steps.md).';
const SCROLL_BY =
  'Scroll to what you need instead: `I scroll to the "…" section`, or to the bottom of the page. Clicks and checks scroll by themselves.';
const ATTRIBUTE =
  'Check what the user sees instead: `I see the "…" button is disabled`, is enabled, is checked or is expanded. For a check no step has, write a step in TypeScript (docs/writing-steps.md).';
const ATTRIBUTE_VALUE =
  'For a link: `I see the "…" link leads to "/…"`. For a menu or an accordion: `I see the "…" button is expanded`. For a check no step has, write a step in TypeScript (docs/writing-steps.md).';
const CLASS =
  'A class is how the page is built, not what the user sees. Check the state instead, such as `I see the "…" button is disabled`, or how it looks: `I see the "…" element matches the screenshot "…"`.';
const DOWNLOAD =
  'Click it: `I click the "…" button`. Every click catches a download, and `I see the downloaded file "…"` waits for it.';
const SAVE_DOWNLOAD =
  'Check the file with `I see the text "…" in the downloaded file`. A file to upload goes into the project, such as data/files/, for `I upload the file "data/files/…" with the "…" button`.';
const COMMAND =
  'A reviewer cannot judge a shell command, and it depends on the shell. Fill the database once per run with globalSetup or the webServer command in playwright.config.ts (docs/setup.md), and create the data one test needs through the app: `I create "…" at "/api/…" with "…"`.';
const PAGE_LOAD =
  'Opening a page and clicking already wait for it. Check for what the user waits for instead, such as `I see the "…" heading`.';

/**
 * Steps that people from Cypress, Selenium, Gauge or Robot Framework, and AI assistants, write on
 * their own, and that Plainwright leaves out on purpose, with what to write instead. lint,
 * keywords and runs name the replacement for a step that matches one, instead of only "unknown
 * step". The step reference lists them.
 */
export const LEFT_OUT_STEPS: readonly LeftOutStep[] = [
  { pattern: 'I wait {number} millisecond(s)', instead: MILLISECONDS },
  { pattern: 'I wait for the page to load', instead: PAGE_LOAD },
  { pattern: 'I wait for network idle', instead: PAGE_LOAD },
  {
    pattern: 'I type {string} on the keyboard',
    instead:
      'Name the field: `I type "…" in the "…" field`, which also presses the keys one by one. To replace its content, `I fill "…" in the "…" field`.',
  },
  { pattern: 'I hold down the key {string}', instead: HOLD_KEY },
  { pattern: 'I release the key {string}', instead: HOLD_KEY },
  {
    pattern: 'I insert the text {string}',
    instead: 'Name the field: `I fill "…" in the "…" field`.',
  },
  { pattern: 'I click at x {number} y {number}', instead: COORDINATES, bareNumbers: true },
  { pattern: 'I double click at x {number} y {number}', instead: COORDINATES, bareNumbers: true },
  { pattern: 'I right click at x {number} y {number}', instead: COORDINATES, bareNumbers: true },
  {
    pattern: 'I move the mouse to x {number} y {number}',
    instead: `Name the element instead: \`I hover over the "…" link\`. ${POSITION}`,
    bareNumbers: true,
  },
  { pattern: 'I press the mouse button', instead: MOUSE_BUTTON },
  { pattern: 'I press the {string} mouse button', instead: MOUSE_BUTTON },
  { pattern: 'I release the mouse button', instead: MOUSE_BUTTON },
  {
    pattern: 'I scroll the mouse wheel by x {number} y {number}',
    instead: SCROLL_BY,
    bareNumbers: true,
  },
  {
    pattern: 'I tap at x {number} y {number}',
    instead: `Name the element instead: \`I tap the "…" button\`. ${POSITION}`,
    bareNumbers: true,
  },
  { pattern: 'I scroll down by {number} pixels', instead: SCROLL_BY, bareNumbers: true },
  { pattern: 'I scroll up by {number} pixels', instead: SCROLL_BY, bareNumbers: true },
  {
    pattern: 'I see the attribute {string} on the {element}',
    instead: ATTRIBUTE,
  },
  {
    pattern: 'I do not see the attribute {string} on the {element}',
    instead: ATTRIBUTE,
  },
  {
    pattern: 'I see the attribute {string} with the value {string} on the {element}',
    instead: ATTRIBUTE_VALUE,
  },
  {
    pattern: 'I see the attribute {string} containing {string} on the {element}',
    instead: ATTRIBUTE_VALUE,
  },
  { pattern: 'I see the class {string} on the {element}', instead: CLASS },
  {
    pattern: 'I do not see the class {string} on the {element}',
    instead: CLASS,
  },
  { pattern: 'I download the file with the {element}', instead: DOWNLOAD },
  { pattern: 'I save the downloaded file to {string}', instead: SAVE_DOWNLOAD },
  { pattern: 'I run the command {string}', instead: COMMAND },
];

const expressions = new Map<LeftOutStep, CucumberExpression>();
const BARE_NUMBER = /(?<=^|\s)(-?\d+(?:\.\d+)?)(?=\s|$)/g;

/** The left-out step the text matches, if any. */
export function leftOutStep(text: string): LeftOutStep | undefined {
  // I click at x 10 y 20 → I click at x "10" y "20"
  const quoted = text.replace(BARE_NUMBER, '"$1"');
  return LEFT_OUT_STEPS.find((leftOut) => {
    let expression = expressions.get(leftOut);
    if (!expression) {
      expression = new CucumberExpression(leftOut.pattern, parameterTypes);
      expressions.set(leftOut, expression);
    }
    if (expression.match(text) !== null) return true;
    return leftOut.bareNumbers === true && quoted !== text && expression.match(quoted) !== null;
  });
}

/** `Plainwright has no step "I wait "500" milliseconds". Check for …`, or undefined for other steps. */
export function leftOutMessage(text: string, leftOut = leftOutStep(text)): string | undefined {
  // The backticks mark steps in the step reference; messages write steps as plain text.
  return leftOut && `Plainwright has no step "${text}". ${leftOut.instead.replace(/`/g, '')}`;
}
