import fs from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import { globSync } from 'tinyglobby';

/**
 * Values written inside quotes as `{name.path}`: `{users.admin.email}` from `data/users.json`,
 * `{env.TEST_PASSWORD}` from the environment or `.env`, `{order.id}` remembered earlier in the
 * test, and the built-in `{unique}`, `{today}` and the other dates. `\{` writes a literal brace.
 */
const NAME = '[\\p{L}\\p{N}_-]+';
const REFERENCE = new RegExp(`(\\\\?)\\{(${NAME}(?:\\.${NAME})*)\\}`, 'gu');
const WHOLE_REFERENCE = new RegExp(`^\\{(${NAME}(?:\\.${NAME})*)\\}$`, 'u');
const VALID_NAME = new RegExp(`^${NAME}$`, 'u');

/** Names that are not data files or remembered values, besides the dates. */
const RESERVED = ['env', 'unique'];

/** Dates relative to today: `today`, `tomorrow`, `yesterday`, `in-7-days`, `7-days-ago`. */
const DATE = /^(?:today|tomorrow|yesterday|in-(\d+)-days|(\d+)-days-ago)$/;
/** `{today.local}`: as the browser writes it; `{today.day}`, `.month`, `.year`: its parts. */
const DATE_PARTS = ['local', 'day', 'month', 'year'];

type DataFile = { value: unknown; file: string };

/** Data files by name: `users` for `data/users.json`, `shop.products` for `data/shop/products.json`. */
const data = new Map<string, DataFile>();
const loadedDataFiles = new Set<string>();

/**
 * Values remembered in a test, and its `{unique}`. Keyed by Playwright's TestInfo. `remembered`
 * lists the names remembered since the running step started, for the report; `secrets` the
 * names of values made from the environment, which the report hides.
 */
type TestValues = {
  values: Map<string, unknown>;
  unique?: string;
  remembered: string[];
  secrets: Set<string>;
};
const testValues = new WeakMap<object, TestValues>();
/** Used outside a running test, e.g. in unit tests. */
const outsideTest: TestValues = { values: new Map(), remembered: [], secrets: new Set() };

/**
 * Loads the JSON files in a folder as test data. A step refers to a value with
 * `{file.key.key}` inside quotes:
 *
 *   defineData('data');   // data/users.json → "{users.admin.email}"
 *
 * Paths are relative to the current working directory, like defineKeywords().
 */
export function defineData(folder: string, options: { cwd?: string } = {}): string[] {
  const cwd = options.cwd ?? process.cwd();
  const root = path.resolve(cwd, folder);
  const files = globSync('**/*.json', { cwd: root, absolute: true }).sort();
  const names: string[] = [];
  for (const file of files) {
    if (loadedDataFiles.has(file)) continue;
    const rel = path.relative(cwd, file) || file;
    const name = path
      .relative(root, file)
      .replace(/\.json$/, '')
      .split(/[\\/]/)
      .join('.');
    const invalid = name.split('.').find((part) => !VALID_NAME.test(part));
    // A folder that also holds other files must not stop the tests: skip what no step can name.
    if (invalid !== undefined) {
      console.warn(
        `[plainwright] Skipped ${rel}: steps can only refer to data files whose names have ` +
          `letters, digits, - and _. Rename "${invalid}" to use it.`,
      );
      continue;
    }
    const first = name.split('.')[0];
    if (isReserved(first)) {
      throw new Error(`[plainwright] ${rel}: "${first}" is reserved. Rename the data file.`);
    }
    const existing = data.get(name);
    if (existing) {
      throw new Error(
        `[plainwright] ${rel}: The data name "${name}" is already used by ${path.relative(cwd, existing.file)}.`,
      );
    }
    let value: unknown;
    try {
      value = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      throw new Error(`[plainwright] ${rel}: Not valid JSON. ${(error as Error).message}`);
    }
    data.set(name, { value, file });
    loadedDataFiles.add(file);
    names.push(name);
  }
  return names;
}

/** The names of all loaded data files, with their files. */
export function getDataFiles(): { name: string; file: string; value: unknown }[] {
  return [...data].map(([name, { file, value }]) => ({ name, file, value }));
}

/** Keeps a value for the rest of the test under a name, so later steps can write `{name}`. */
export function remember(name: string, value: unknown) {
  const problem = checkRememberName(name);
  if (problem) throw new Error(`[plainwright] ${problem}`);
  const values = current();
  values.values.set(name, value);
  values.secrets.delete(name);
  values.remembered.push(name);
}

/**
 * The values remembered since the last call, for the report. With `secret`, they were made from
 * the environment: the report hides them here and wherever they are used later.
 */
export function takeRemembered({ secret = false } = {}): ResolvedReference[] {
  const { values, remembered, secrets } = current();
  return remembered.splice(0).map((name) => {
    if (secret) secrets.add(name);
    return { reference: name, shown: secret ? HIDDEN : show(values.get(name)) };
  });
}

/** Why a value cannot be remembered under this name, or null when it can. */
export function checkRememberName(name: string): string | null {
  if (!VALID_NAME.test(name)) {
    return `"${name}" cannot be remembered: a name may only contain letters, digits, - and _, such as "${suggestName(name)}".`;
  }
  if (isReserved(name)) {
    return `"${name}" is reserved. Remember the value under another name.`;
  }
  return null;
}

/** `order number` → `order-number`. */
function suggestName(name: string) {
  return (
    name
      .trim()
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'name'
  );
}

/** A quoted number written as a reference, `"{cart.count}"`; filled in when the step runs. */
export class NumberReference {
  constructor(readonly text: string) {}

  resolve(used: ResolvedReference[] = []): number {
    const text = resolveText(this.text, used);
    const number = Number(text);
    if (!text.trim() || Number.isNaN(number)) {
      throw new Error(`[plainwright] ${this.text} is "${text}", not a number.`);
    }
    return number;
  }

  toString() {
    return this.text;
  }
}

/** How the report shows a value from the environment. */
export const HIDDEN = '(hidden)';

/** One reference that was filled in, for the report. Values from the environment are hidden. */
export type ResolvedReference = { reference: string; shown: string };

/**
 * Fills in every `{reference}` in the text. With `raw`, a text that is exactly one reference
 * returns the value itself, such as the object from a data file; otherwise objects are written
 * as JSON.
 */
export function resolveText(text: string, used: ResolvedReference[] = []): string {
  return resolve(text, used, false) as string;
}

export function resolveRaw(text: string, used: ResolvedReference[] = []): unknown {
  return resolve(text, used, true);
}

/** References in a text, without the braces: `users.admin.email`. Escaped ones are left out. */
export function referencesIn(text: string): string[] {
  return [...text.matchAll(REFERENCE)].filter((m) => !m[1]).map((m) => m[2]);
}

/**
 * Where a reference would come from, for lint: `'data'`, `'built-in'`, `'env'`, or the error
 * message when there is no data file of that name and `remembered` does not contain it.
 */
export function checkReference(reference: string, remembered: ReadonlySet<string>): string | null {
  const [root] = reference.split('.');
  if (root === 'env') return reference.includes('.') ? null : 'Write {env.NAME}.';
  if (root === 'unique') return reference === root ? null : '{unique} has no parts.';
  if (dateOffset(root) !== undefined) return datePartProblem(reference);
  if (remembered.has(root)) return null;
  const found = findData(reference);
  if (found) {
    try {
      walk(found.value, found.rest, `{${found.name}}`, reference);
      return null;
    } catch (error) {
      return (error as Error).message.replace(/^\[plainwright\] /, '');
    }
  }
  return unknownMessage(reference);
}

function resolve(text: string, used: ResolvedReference[], raw: boolean, trail: string[] = []) {
  const whole = WHOLE_REFERENCE.exec(text);
  if (raw && whole) return lookup(whole[1], used, trail);
  return text.replace(REFERENCE, (match, escaped: string, reference: string) => {
    if (escaped) return match.slice(1);
    const value = lookup(reference, used, trail);
    return typeof value === 'string' ? value : JSON.stringify(value);
  });
}

function lookup(reference: string, used: ResolvedReference[], trail: string[]): unknown {
  if (trail.includes(reference)) {
    throw new Error(
      `[plainwright] Values refer to each other in a loop: ${[...trail, reference].map((r) => `{${r}}`).join(' → ')}.`,
    );
  }
  const [root, ...rest] = reference.split('.');
  let value: unknown;
  if (root === 'env') {
    const name = rest.join('.');
    if (!name) throw new Error('[plainwright] Write {env.NAME} for the environment variable NAME.');
    value = process.env[name];
    if (value === undefined) {
      throw new Error(
        `[plainwright] The environment variable ${name} is not set. Set it, or add it to the .env file.`,
      );
    }
    used.push({ reference, shown: HIDDEN });
    return value;
  }
  const values = current();
  if (root === 'unique' && !rest.length) {
    values.unique ??= uniqueId();
    value = values.unique;
  } else if (dateOffset(root) !== undefined) {
    const problem = datePartProblem(reference);
    if (problem) throw new Error(`[plainwright] ${problem}`);
    value = dateValue(dateOffset(root)!, rest[0], dateOptions());
  } else if (values.values.has(root)) {
    value = walk(values.values.get(root), rest, `{${root}}`, reference);
    if (values.secrets.has(root)) {
      used.push({ reference, shown: HIDDEN });
      return value;
    }
  } else {
    const found = findData(reference);
    if (!found) throw new Error(`[plainwright] ${unknownMessage(reference)}`);
    value = walk(found.value, found.rest, `{${found.name}}`, reference);
    // Data files may refer to other values, e.g. "email": "test-{unique}@example.com".
    value = resolveNested(value, used, [...trail, reference]);
  }
  used.push({ reference, shown: show(value) });
  return value;
}

function resolveNested(value: unknown, used: ResolvedReference[], trail: string[]): unknown {
  if (typeof value === 'string') return resolve(value, used, true, trail);
  if (Array.isArray(value)) return value.map((item) => resolveNested(item, used, trail));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveNested(item, used, trail)]),
    );
  }
  return value;
}

/** The data file a reference starts with: the longest name, so `shop.products` wins over `shop`. */
function findData(reference: string) {
  const parts = reference.split('.');
  for (let i = parts.length; i > 0; i--) {
    const name = parts.slice(0, i).join('.');
    const file = data.get(name);
    if (file) return { name, value: file.value, rest: parts.slice(i) };
  }
  return undefined;
}

function walk(value: unknown, keys: string[], where: string, reference: string): unknown {
  let current = value;
  let at = where.slice(1, -1);
  for (const key of keys) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) {
      const known =
        current && typeof current === 'object' ? Object.keys(current).map((k) => `"${k}"`) : [];
      throw new Error(
        `[plainwright] No value {${reference}}: {${at}} has no "${key}".` +
          (known.length ? ` It has ${known.join(', ')}.` : ''),
      );
    }
    current = (current as Record<string, unknown>)[key];
    at += `.${key}`;
  }
  return current;
}

function unknownMessage(reference: string) {
  const [root] = reference.split('.');
  const names = [...new Set([...data.keys(), ...current().values.keys()])].map((n) => `{${n}}`);
  return (
    `No value named "${root}" for {${reference}}. ` +
    (names.length ? `Known values: ${names.join(', ')}, ` : 'Known values: ') +
    `{env.NAME}, {unique}, {today} and the other dates. Add data/${root}.json, or remember a value as "${root}" first. ` +
    `For literal braces, write \\{${reference}}.`
  );
}

function current(): TestValues {
  let info: object;
  try {
    info = test.info();
  } catch {
    return outsideTest;
  }
  let values = testValues.get(info);
  if (!values) {
    testValues.set(info, (values = { values: new Map(), remembered: [], secrets: new Set() }));
  }
  return values;
}

function show(value: unknown) {
  return typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
}

/** Short, safe in emails and addresses, and different for every test: `m3k9x2ab`. */
function uniqueId() {
  return Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 6);
}

function isReserved(name: string) {
  return RESERVED.includes(name) || DATE.test(name);
}

/** Days from today for a date name, `in-7-days` → 7, or undefined for other names. */
export function dateOffset(name: string): number | undefined {
  const match = DATE.exec(name);
  if (!match) return undefined;
  if (match[1] !== undefined) return Number(match[1]);
  if (match[2] !== undefined) return -Number(match[2]);
  return { today: 0, tomorrow: 1, yesterday: -1 }[name];
}

function datePartProblem(reference: string): string | null {
  const [root, ...rest] = reference.split('.');
  if (!rest.length || (rest.length === 1 && DATE_PARTS.includes(rest[0]))) return null;
  return (
    `{${reference}} is not a part of a date. A date has ` +
    `${DATE_PARTS.map((part) => `{${root}.${part}}`).join(', ')}.`
  );
}

export type DateOptions = {
  now?: Date;
  /** The browser's language, `use.locale`, for `.local`. Default: the system's. */
  locale?: string;
  /** `use.timezoneId`, so the date is the one the browser shows. Default: the system's. */
  timeZone?: string;
};

/**
 * A date some days from today: `2026-10-28`, or with a part, `21.10.2026` (`local` in de-DE),
 * `21` (`day`), `10` (`month`), `2026` (`year`).
 */
export function dateValue(
  offset: number,
  part?: string,
  { now = new Date(), locale, timeZone }: DateOptions = {},
): string {
  const today = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, Number(value)]),
  );
  // Counted in UTC, where every day has 24 hours.
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = String(date.getUTCFullYear());
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  if (part === 'local') return new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).format(date);
  if (part === 'day') return day;
  if (part === 'month') return month;
  if (part === 'year') return year;
  return `${year}-${month}-${day}`;
}

/** The project's language and time zone, so dates are written as the browser writes them. */
function dateOptions(): DateOptions {
  try {
    const { locale, timezoneId } = test.info().project.use;
    return { locale, timeZone: timezoneId };
  } catch {
    return {};
  }
}
