import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CucumberExpression } from '@cucumber/cucumber-expressions';
import type {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test';
import { test } from '@playwright/test';
import type { BddTestFixtures, BddWorkerFixtures } from 'playwright-bdd';
import { ELEMENT_TYPES, ElementRef } from './elements';
import { KeywordsFixtures, KeywordsOptions, Step } from './fixtures';
import { parameterTypes } from './params';
import { removedMessage } from './removed';
import { levenshtein } from './similar';
import {
  HIDDEN,
  NumberReference,
  ResolvedReference,
  resolveRaw,
  resolveText,
  takeRemembered,
} from './values';

export type StepLevel = 'core' | 'advanced';
export type StepSource = 'built-in' | 'project' | 'keyword';
export type StepLocation = { file: string; line: number; column: number };

/** Fixtures a step function can destructure from its first argument. */
export type StepFixtures = PlaywrightTestArgs &
  PlaywrightTestOptions &
  PlaywrightWorkerArgs &
  PlaywrightWorkerOptions &
  BddTestFixtures &
  BddWorkerFixtures &
  KeywordsFixtures &
  KeywordsOptions;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepFn<F = StepFixtures> = (this: unknown, fixtures: F, ...args: any[]) => unknown;

export type StepOptions<F = StepFixtures> = {
  /** Cucumber expression, e.g. `I click the {element}`. This text is public API. */
  pattern: string;
  /** One sentence that says exactly what the step does. */
  description: string;
  /** A complete step text that matches this pattern and no other. */
  example: string;
  /** Section in the docs, e.g. "Forms". */
  category?: string;
  /** `core` steps are the recommended vocabulary; `advanced` steps are for special cases. */
  level?: StepLevel;
  /** When set, lint warns wherever the step is used, with this explanation. */
  discouraged?: string;
  /**
   * The name the step remembers a value under, from its arguments, such as
   * `(args) => String(args[1])` for `... as {string}`. Lets lint check later `{name}` values.
   */
  remembers?: (args: unknown[]) => string;
  fn: StepFn<F>;
};

export type StepDefinition = {
  readonly pattern: string;
  readonly description: string;
  readonly example: string;
  readonly category: string;
  readonly level: StepLevel;
  readonly source: StepSource;
  readonly discouraged?: string;
  readonly location?: StepLocation;
  /** Parameter types in order of appearance, e.g. `['string', 'element']`. */
  readonly parameters: string[];
  /** Fixture names the step function destructures, e.g. `['world']`. */
  readonly fixtures: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly fn: StepFn<any>;
};

export type StepMatch = { step: StepDefinition; args: unknown[] };

type RegisterMeta = {
  source: StepSource;
  location?: StepLocation;
  arityCheck?: boolean;
  /**
   * How `{references}` in quoted values reach the step: filled into the text (default), as the
   * value itself when the quotes hold exactly one reference (`raw`), or not at all (`none`, for
   * keywords, whose steps fill them in).
   */
  values?: 'text' | 'raw' | 'none';
};

const steps: StepDefinition[] = [];
const expressions = new WeakMap<StepDefinition, CucumberExpression>();
const remembering = new WeakMap<StepDefinition, (args: unknown[]) => string>();
/** Steps whose pattern cannot be compiled here, with the reason. */
const unusable = new Map<StepDefinition, string>();

/**
 * Defines a step for feature files and registers it with playwright-bdd.
 * Steps defined this way also appear in docs, the AI catalog, keywords and lint.
 *
 *   defineStep({
 *     pattern: 'I add {string} to the cart',
 *     description: 'Searches for the product and adds it to the shopping cart.',
 *     example: 'I add "Coffee" to the cart',
 *     fn: async ({ world }, product: string) => { ... },
 *   });
 */
export function defineStep<F = StepFixtures>(options: StepOptions<F>): StepDefinition {
  return registerStep(options, { source: 'project', location: callerLocation() });
}

/** Internal: registers a step with explicit source metadata. */
export function registerStep<F>(options: StepOptions<F>, meta: RegisterMeta): StepDefinition {
  for (const key of ['pattern', 'description', 'example'] as const) {
    if (typeof options[key] !== 'string' || !options[key].trim()) {
      throw new Error(`[plainwright] defineStep() needs a non-empty "${key}".`);
    }
  }
  if (typeof options.fn !== 'function') {
    throw new Error(`[plainwright] defineStep("${options.pattern}") needs a function "fn".`);
  }
  if (steps.some((step) => step.pattern === options.pattern)) {
    throw new Error(`[plainwright] The step "${options.pattern}" is defined twice.`);
  }
  const fn = meta.values === 'none' ? options.fn : withValues(options.fn, meta.values ?? 'text');
  const step: StepDefinition = Object.freeze({
    pattern: options.pattern,
    description: options.description,
    example: options.example,
    category: options.category ?? 'Project steps',
    level: options.level ?? 'core',
    source: meta.source,
    discouraged: options.discouraged,
    location: meta.location,
    parameters: parameterNames(options.pattern),
    fixtures: fixtureNames(options.fn),
    fn,
  });
  steps.push(step);
  if (options.remembers) remembering.set(step, options.remembers);
  const providedOptions = meta.arityCheck === false ? { arityCheck: false } : {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Step as any)(step.pattern, providedOptions, step.fn);
  return step;
}

/** The name a step remembers a value under, given the step's arguments. */
export function rememberedName(step: StepDefinition, args: unknown[]): string | undefined {
  return remembering.get(step)?.(args);
}

/**
 * Fills in `{references}` in the step's values before it runs, and lists them as a nested step
 * in the report; after it, the values it remembered. The wrapper keeps the signature of `fn`,
 * from which playwright-bdd reads the fixtures to pass.
 */
function withValues<F>(fn: StepFn<F>, mode: 'text' | 'raw'): StepFn<F> {
  const wrapped = async function (this: unknown, fixtures: F, ...args: unknown[]) {
    const used: ResolvedReference[] = [];
    const values = args.map((arg) => resolveArg(arg, mode, used));
    if (used.length) await showValues('', used);
    takeRemembered();
    let result: unknown;
    try {
      result = await fn.call(this, fixtures, ...values);
    } catch (error) {
      hideOwnFrames(error);
      throw error;
    }
    // A value made from a secret stays hidden, also in later steps.
    const remembered = takeRemembered({ secret: used.some((u) => u.shown === HIDDEN) });
    if (remembered.length) await showValues('remembered ', remembered);
    return result;
  };
  wrapped.toString = () => fn.toString();
  Object.defineProperty(wrapped, 'length', { value: fn.length });
  return wrapped;
}

/** `{order.id} = "1001", {users.admin.email} = "admin@example.com"` as a nested step. */
async function showValues(prefix: string, values: ResolvedReference[]) {
  const shown = [...new Map(values.map((u) => [u.reference, u.shown])).entries()]
    .map(([reference, value]) => `{${reference}} = ${shorten(value)}`)
    .join(', ');
  // The report links the line to where the step is written, not to this file.
  await test.step(`${prefix}${shown}`, () => {}, {
    location: runningKeywordStep ?? stepCallSite(),
  });
}

/** Where the step a keyword is running is written, while it runs. */
let runningKeywordStep: StepLocation | undefined;

/** Runs a step of a keyword, so its value line in the report links to the keyword file. */
export async function runAt<T>(location: StepLocation, fn: () => T | Promise<T>): Promise<T> {
  const before = runningKeywordStep;
  runningKeywordStep = location;
  try {
    return await fn();
  } finally {
    runningKeywordStep = before;
  }
}

/** Where the running step is called in the test: its line in the test file, as in the report. */
function stepCallSite(): StepLocation | undefined {
  let info;
  try {
    info = test.info();
  } catch {
    return undefined;
  }
  const { file, line, column } = info;
  for (const frame of new Error().stack?.split('\n').slice(1) ?? []) {
    const location = parseStackFrame(frame.replace(/^\s*at async /, 'at '));
    if (location?.file === file) return location;
  }
  return { file, line, column };
}

/**
 * Removes the stack frames inside this package from a step's error, so the stack Playwright
 * prints leads to the test and to project step files, not into node_modules.
 */
function hideOwnFrames(error: unknown) {
  if (!(error instanceof Error) || !error.stack) return;
  const own = __dirname + path.sep;
  const lines = error.stack.split('\n');
  const kept = lines.filter((line) => !(/^\s+at /.test(line) && line.includes(own)));
  if (kept.length < lines.length) error.stack = kept.join('\n');
}

function resolveArg(arg: unknown, mode: 'text' | 'raw', used: ResolvedReference[]): unknown {
  if (typeof arg === 'string')
    return mode === 'raw' ? resolveRaw(arg, used) : resolveText(arg, used);
  if (arg instanceof NumberReference) return arg.resolve(used);
  if (arg instanceof ElementRef) return resolveElement(arg, used);
  return arg;
}

function resolveElement(ref: ElementRef, used: ResolvedReference[]): ElementRef {
  return new ElementRef(
    resolveText(ref.name, used),
    ref.type,
    ref.container && resolveElement(ref.container, used),
  );
}

function shorten(text: string) {
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

/** All registered steps in registration order. */
export function getSteps(): readonly StepDefinition[] {
  return steps;
}

/** All steps whose pattern matches the step text (without the Given/When/Then keyword). */
export function findSteps(text: string): StepMatch[] {
  const matches: StepMatch[] = [];
  for (const step of steps) {
    const result = expressionOf(step)?.match(text);
    if (result) matches.push({ step, args: result.map((arg) => arg.getValue(null)) });
  }
  return matches;
}

/** The single step matching the text. Throws a readable error when none or several match. */
export function findStep(text: string): StepMatch {
  const matches = findSteps(text);
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) {
    const removed = removedMessage(text);
    if (removed) throw new Error(removed);
    const missingType = elementTypeHint(text);
    if (missingType) throw new Error(`No step matches "${text}". ${missingType}`);
    const suggestions = suggestionsFor(text);
    throw new Error(
      `No step matches "${text}".` +
        (suggestions.length
          ? `\nDid you mean:\n${suggestions.map((s) => `  - ${s}`).join('\n')}`
          : ''),
    );
  }
  throw new Error(
    `"${text}" matches ${matches.length} steps:\n` +
      matches.map(({ step }) => `  - ${step.pattern}${formatLocation(step.location)}`).join('\n'),
  );
}

/**
 * How to write `text` with the step: its example with the quoted values of `text` in place of
 * its own, when there are as many and the result matches the step.
 * `I clik the "Add" button` → `I click the "Add" button`.
 */
export function suggestionFor(step: StepDefinition, text: string): string {
  const quoted = /"(?:[^"\\]|\\.)*"/g;
  const values = text.match(quoted) ?? [];
  if (!values.length || values.length !== (step.example.match(quoted) ?? []).length) {
    return step.example;
  }
  let i = 0;
  const filled = step.example.replace(quoted, () => values[i++]);
  return findSteps(filled).some((match) => match.step === step) ? filled : step.example;
}

/**
 * How to write `text` with the closest steps, with its own values where they fit. Wordings of
 * other tools are read as Plainwright's first: `I should see the text "Saved"` →
 * `I see the text "Saved"`, and bare numbers as values: `I see 2 items` → `I see "2" items`.
 */
export function suggestionsFor(text: string, limit = 3): string[] {
  const reworded = quoteNumbers(plainwrightWording(text));
  if (reworded !== text && findSteps(reworded).length === 1) return [reworded];
  return suggestSteps(reworded, limit).map((step) => suggestionFor(step, reworded));
}

/** Wordings that people from Cucumber, Cypress or Selenium write, and Plainwright's for them. */
const OTHER_WORDINGS: [RegExp, string][] = [
  [/^I should not see\b/i, 'I do not see'],
  [/^I should see\b/i, 'I see'],
  [/^I click on\b/i, 'I click'],
  [/^I enter\b/i, 'I fill'],
];

function plainwrightWording(text: string) {
  for (const [wording, replacement] of OTHER_WORDINGS) {
    if (wording.test(text)) return text.replace(wording, replacement);
  }
  return text;
}

/** Numbers outside quotes, quoted like every value: `I wait 2 seconds` → `I wait "2" seconds`. */
function quoteNumbers(text: string) {
  return text
    .split(/("(?:[^"\\]|\\.)*")/)
    .map((part, i) => (i % 2 ? part : part.replace(/(?<=^|\s)(\d+(?:[.,]\d+)?)(?=\s|$)/g, '"$1"')))
    .join('');
}

/**
 * When `text` names an element without its type, such as `I click the "Save"`, how to add it.
 * Otherwise undefined.
 */
export function elementTypeHint(text: string): string | undefined {
  const untyped = /\bthe ("(?:[^"\\]|\\.)*")(?=$|\s+(?:in|to|with)\s+the\b)/g;
  const typed = text.replace(untyped, 'the $1 button');
  if (typed === text || findSteps(typed).length !== 1) return undefined;
  return (
    `After the name in quotes comes the type of the element, such as ${typed}. ` +
    `The types: ${ELEMENT_TYPES.join(', ')}.`
  );
}

/** Steps whose example is closest to the given text; core steps first when about as close. */
export function suggestSteps(text: string, limit = 3): StepDefinition[] {
  const normalized = normalizeForSuggestion(text);
  return steps
    .map((step) => ({
      step,
      distance:
        levenshtein(normalized, normalizeForSuggestion(step.example)) /
          Math.max(normalized.length, 1) +
        (step.level === 'advanced' ? 0.05 : 0),
    }))
    .filter(({ distance }) => distance < 0.5)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ step }) => step);
}

export function formatLocation(location?: StepLocation) {
  return location ? ` (${location.file}:${location.line})` : '';
}

/**
 * Steps that lint, keywords and findStep() skip because their pattern uses a parameter type
 * this package does not know, e.g. one defined with playwright-bdd's own defineParameterType().
 * playwright-bdd itself still runs them.
 */
export function getUnusableSteps(): { step: StepDefinition; message: string }[] {
  for (const step of steps) expressionOf(step);
  return [...unusable].map(([step, message]) => ({ step, message }));
}

function expressionOf(step: StepDefinition): CucumberExpression | undefined {
  let expression = expressions.get(step);
  if (!expression && !unusable.has(step)) {
    try {
      expression = new CucumberExpression(step.pattern, parameterTypes);
      expressions.set(step, expression);
    } catch (error) {
      // cucumber-expressions' UndefinedParameterTypeError, which it does not export.
      const name = (error as { undefinedParameterTypeName?: string }).undefinedParameterTypeName;
      if (!name) throw error;
      unusable.set(
        step,
        `The step "${step.pattern}" uses the parameter type {${name}}, which Plainwright ` +
          `does not know. Define it with defineParameterType() from @nils.hoyer/plainwright instead ` +
          `of playwright-bdd; until then, keywords and lint skip this step.`,
      );
    }
  }
  return expression;
}

function parameterNames(pattern: string): string[] {
  return [...pattern.matchAll(/(?<!\\)\{([^}]*)\}/g)].map((m) => m[1] || 'anonymous');
}

/** Fixture names from the destructured first parameter, e.g. `async ({ page, world }, x) => …`. */
export function fixtureNames(fn: Function): string[] {
  const source = fn.toString().replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  const match = /^[^(]*\(\s*\{([^}]*)\}/.exec(source);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((part) => part.split(':')[0].trim())
    .filter(Boolean);
}

function callerLocation(): StepLocation | undefined {
  const lines = new Error().stack?.split('\n') ?? [];
  // [0] "Error", [1] callerLocation, [2] defineStep, [3] the caller
  return parseStackFrame(lines[3] ?? '');
}

/**
 * The location in a stack frame: `at fn (/path/to/file.ts:3:5)`, `at /path/to/file.ts:3:5`
 * or `at file:///path/to/file.ts:3:5`. Paths may contain spaces and brackets.
 */
export function parseStackFrame(frame: string): StepLocation | undefined {
  const text = frame.trim().replace(/^at\s+/, '');
  // With a function name, the location is in brackets at the end.
  const location = text.endsWith(')') ? text.slice(text.indexOf('(') + 1, -1) : text;
  const match = /^(.+):(\d+):(\d+)$/.exec(location);
  if (!match) return undefined;
  let file = match[1];
  if (file.startsWith('file://')) {
    try {
      file = fileURLToPath(file);
    } catch {
      return undefined;
    }
  }
  return { file, line: Number(match[2]), column: Number(match[3]) };
}

function normalizeForSuggestion(text: string) {
  return text.toLowerCase().replace(/"[^"]*"/g, '""');
}
