import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CucumberExpression } from '@cucumber/cucumber-expressions';
import type {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test';
import type { BddTestFixtures, BddWorkerFixtures } from 'playwright-bdd';
import { KeywordsFixtures, KeywordsOptions, Step } from './fixtures';
import { parameterTypes } from './params';

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
  /**
   * Tags from the folder and file names of a project step file, e.g. `['@admin']` for
   * `steps/@admin/users.ts`. The step only applies to scenarios with all of these tags.
   */
  readonly tags: readonly string[];
  /** Parameter types in order of appearance, e.g. `['string', 'element']`. */
  readonly parameters: string[];
  /** Fixture names the step function destructures, e.g. `['world']`. */
  readonly fixtures: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly fn: StepFn<any>;
};

export type StepMatch = { step: StepDefinition; args: unknown[] };

type RegisterMeta = { source: StepSource; location?: StepLocation; arityCheck?: boolean };

const steps: StepDefinition[] = [];
const expressions = new WeakMap<StepDefinition, CucumberExpression>();
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
  // playwright-bdd locates every step in this file, so it cannot see the folder tags of a
  // project step file. We pass them on.
  const tags = meta.source === 'project' && meta.location ? tagsFromPath(meta.location.file) : [];
  if (steps.some((step) => step.pattern === options.pattern && sameTags(step.tags, tags))) {
    throw new Error(`[plainwright] The step "${options.pattern}" is defined twice.`);
  }
  const step: StepDefinition = Object.freeze({
    pattern: options.pattern,
    description: options.description,
    example: options.example,
    category: options.category ?? 'Project steps',
    level: options.level ?? 'core',
    source: meta.source,
    discouraged: options.discouraged,
    location: meta.location,
    tags: Object.freeze(tags),
    parameters: parameterNames(options.pattern),
    fixtures: fixtureNames(options.fn),
    fn: options.fn,
  });
  steps.push(step);
  const providedOptions = {
    ...(meta.arityCheck === false ? { arityCheck: false } : {}),
    ...(tags.length ? { tags: tags.join(' and ') } : {}),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Step as any)(step.pattern, providedOptions, step.fn);
  return step;
}

/** All registered steps in registration order. */
export function getSteps(): readonly StepDefinition[] {
  return steps;
}

/**
 * All steps whose pattern matches the step text (without the Given/When/Then keyword).
 * With `tags` (of a scenario), steps from tagged folders only count when the tags fit.
 */
export function findSteps(text: string, tags?: readonly string[]): StepMatch[] {
  const matches: StepMatch[] = [];
  for (const step of steps) {
    if (tags && !step.tags.every((tag) => tags.includes(tag))) continue;
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
    const suggestions = suggestSteps(text);
    throw new Error(
      `No step matches "${text}".` +
        (suggestions.length
          ? `\nDid you mean:\n${suggestions.map((s) => `  - ${s.example}`).join('\n')}`
          : ''),
    );
  }
  throw new Error(
    `"${text}" matches ${matches.length} steps:\n` +
      matches.map(({ step }) => `  - ${step.pattern}${formatLocation(step.location)}`).join('\n'),
  );
}

/** Steps whose example is closest to the given text. */
export function suggestSteps(text: string, limit = 3): StepDefinition[] {
  const normalized = normalizeForSuggestion(text);
  return steps
    .map((step) => ({
      step,
      distance:
        levenshtein(normalized, normalizeForSuggestion(step.example)) /
        Math.max(normalized.length, 1),
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
          `does not know. Define it with defineParameterType() from plainwright instead ` +
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

/** Tags in folder and file names, like playwright-bdd: `steps/@admin/@beta.users.ts` → `['@admin', '@beta']`. */
export function tagsFromPath(file: string, cwd = process.cwd()): string[] {
  const relative = path.isAbsolute(file) ? path.relative(cwd, file) : file;
  const parts = relative.split(/[\\/]/);
  if (parts.includes('node_modules')) return [];
  parts[parts.length - 1] = parts[parts.length - 1].split('.')[0];
  return [...new Set(parts.flatMap((part) => part.match(/@[^@\s]+/g) ?? []))];
}

function sameTags(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((tag) => b.includes(tag));
}

function normalizeForSuggestion(text: string) {
  return text.toLowerCase().replace(/"[^"]*"/g, '""');
}

export function levenshtein(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}
