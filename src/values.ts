import fs from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import { globSync } from 'tinyglobby';

/**
 * Values written inside quotes as `{name.path}`: `{users.admin.email}` from `data/users.json`,
 * `{env.TEST_PASSWORD}` from the environment or `.env`, `{order.id}` remembered earlier in the
 * test, and the built-in `{unique}` and `{today}`. `\{` writes a literal brace.
 */
const NAME = '[\\p{L}\\p{N}_-]+';
const REFERENCE = new RegExp(`(\\\\?)\\{(${NAME}(?:\\.${NAME})*)\\}`, 'gu');
const WHOLE_REFERENCE = new RegExp(`^\\{(${NAME}(?:\\.${NAME})*)\\}$`, 'u');
const VALID_NAME = new RegExp(`^${NAME}$`, 'u');

/** Names that are not data files or remembered values. */
const RESERVED = ['env', 'unique', 'today'];

type DataFile = { value: unknown; file: string };

/** Data files by name: `users` for `data/users.json`, `shop.products` for `data/shop/products.json`. */
const data = new Map<string, DataFile>();
const loadedDataFiles = new Set<string>();

/** Values remembered in a test, and its `{unique}`. Keyed by Playwright's TestInfo. */
type TestValues = { values: Map<string, unknown>; unique?: string };
const testValues = new WeakMap<object, TestValues>();
/** Used outside a running test, e.g. in unit tests. */
const outsideTest: TestValues = { values: new Map() };

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
    if (RESERVED.includes(first)) {
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
  if (!VALID_NAME.test(name)) {
    throw new Error(
      `[plainwright] "${name}" cannot be remembered: a name may only contain letters, digits, - and _.`,
    );
  }
  if (RESERVED.includes(name)) {
    throw new Error(`[plainwright] "${name}" is reserved. Remember the value under another name.`);
  }
  current().values.set(name, value);
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
  if (root === 'unique' || root === 'today') {
    return reference === root ? null : `{${root}} has no parts.`;
  }
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
    used.push({ reference, shown: '(hidden)' });
    return value;
  }
  const values = current();
  if (root === 'unique' && !rest.length) {
    values.unique ??= uniqueId();
    value = values.unique;
  } else if (root === 'today' && !rest.length) {
    value = today();
  } else if (values.values.has(root)) {
    value = walk(values.values.get(root), rest, `{${root}}`, reference);
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
    `{env.NAME}, {unique}, {today}. Add data/${root}.json, or remember a value as "${root}" first. ` +
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
  if (!values) testValues.set(info, (values = { values: new Map() }));
  return values;
}

function show(value: unknown) {
  return typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
}

/** Short, safe in emails and addresses, and different for every test: `m3k9x2ab`. */
function uniqueId() {
  return Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 6);
}

function today() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
