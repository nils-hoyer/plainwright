import fs from 'node:fs';
import path from 'node:path';
import { dialects } from '@cucumber/gherkin';
import { test as playwrightTest } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { globSync } from 'tinyglobby';
import { workerChecks } from './fixtures';
import { parseGherkin } from './gherkin';
import {
  elementTypeHint,
  findSteps,
  formatLocation,
  getSteps,
  getUnusableSteps,
  registerStep,
  runAt,
  StepDefinition,
  StepFixtures,
  suggestionsFor,
} from './registry';
import { leftOutMessage, leftOutStep } from './left-out';
import { levenshtein } from './similar';

export type KeywordStep = {
  keyword: string;
  text: string;
  line: number;
  column: number;
  /** The cells of the data table below the step, if it has one; `<name>` is filled in. */
  table?: string[][];
};

export type KeywordDefinition = {
  /** The Scenario Outline title, e.g. `I log in as "<username>" with password "<password>"`. */
  readonly title: string;
  /** The step pattern made from the title, e.g. `I log in as {string} with password {string}`. */
  readonly pattern: string;
  /** Parameter names in the order they appear in the title. */
  readonly params: string[];
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly steps: KeywordStep[];
  readonly step: StepDefinition;
};

/** Fixtures that steps inside keywords may use (v1 limitation). */
const KEYWORD_FIXTURES = ['page', 'world'];

const keywords: KeywordDefinition[] = [];
const loadedFiles = new Set<string>();
const keywordOfStep = new WeakMap<StepDefinition, KeywordDefinition>();
const warned = new Set<string>();

/**
 * Loads keywords from .feature files. Each scenario becomes a step whose text is the title;
 * its steps run in order. Parameters are written `"<name>"` in the title, which makes the
 * scenario a `Scenario Outline:`; a keyword without parameters may be a plain `Scenario:`.
 *
 *   defineKeywords('keywords/**\/*.feature');
 *
 * Paths are relative to the current working directory (the project root when you run
 * `npx playwright test`). Problems in the files are reported with file and line before any
 * test runs. Files in `keywords/` load by themselves; a file that is already loaded is skipped.
 */
export function defineKeywords(
  patterns: string | string[],
  options: { cwd?: string } = {},
): KeywordDefinition[] {
  const cwd = options.cwd ?? process.cwd();
  const files = globSync(Array.isArray(patterns) ? patterns : [patterns], {
    cwd,
    absolute: true,
  }).sort();
  if (!files.length) {
    throw new Error(
      `[plainwright] defineKeywords() found no files matching ${JSON.stringify(patterns)} in ${cwd}.`,
    );
  }
  const parsed = files.filter((file) => !loadedFiles.has(file)).flatMap(parseKeywordFile);
  for (const file of files) loadedFiles.add(file);
  parsed.forEach(registerKeyword);
  workerChecks.add(assertKeywordsValid);
  return keywords.filter((keyword) => files.includes(keyword.file));
}

/** All loaded keywords. */
export function getKeywords(): readonly KeywordDefinition[] {
  return keywords;
}

/** The keyword behind a registered step, if the step is a keyword. */
export function keywordOf(step: StepDefinition): KeywordDefinition | undefined {
  return keywordOfStep.get(step);
}

/** Throws one error listing every problem in the loaded keywords. */
export function assertKeywordsValid() {
  for (const { message } of getUnusableSteps()) {
    if (warned.has(message)) continue;
    warned.add(message);
    console.warn(`[plainwright] ${message}`);
  }
  const errors = validateKeywords();
  if (errors.length) {
    throw new Error(`[plainwright] Invalid keywords:\n${errors.join('\n')}`);
  }
}

/**
 * Checks every loaded keyword: each step matches exactly one step definition, all parameters
 * are used, keywords do not call themselves, and the title collides with no other step.
 * Returns messages formatted as `file:line: message`.
 */
export function validateKeywords(): string[] {
  return checkKeywords().errors;
}

/**
 * Like validateKeywords(), plus warnings that do not stop tests: `<…>` in a step that is not
 * a parameter but looks like a misspelled one.
 */
export function checkKeywords(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const calls = new Map<KeywordDefinition, Set<KeywordDefinition>>();

  for (const keyword of keywords) {
    const where = `${relative(keyword.file)}:${keyword.line}`;
    const used = new Set<string>();
    calls.set(keyword, new Set());

    for (const step of sameWording(keyword)) {
      errors.push(
        `${where}: The keyword "${keyword.title}" has the same wording as the step "${step.pattern}"${formatLocation(step.location)}. ` +
          'Steps worded like it match both: reword the keyword.',
      );
    }

    for (const sub of keyword.steps) {
      const subWhere = `${relative(keyword.file)}:${sub.line}`;
      for (const name of [sub.text, ...(sub.table?.flat() ?? [])].flatMap(angleBrackets)) {
        if (keyword.params.includes(name)) {
          used.add(name);
          continue;
        }
        // Any other <…> is text, e.g. HTML. Warn when it looks like a misspelled parameter.
        const meant = keyword.params.find((param) => isMisspelling(name, param));
        if (meant) {
          warnings.push(
            `${subWhere}: <${name}> is not a parameter of "${keyword.title}" and stays as written. Did you mean <${meant}>?`,
          );
        }
      }

      let matches = findSteps(sub.text);
      // A parameter can stand for a number, e.g. I see "<count>" items in the "Cart" list.
      const numbers = Object.fromEntries(keyword.params.map((name) => [name, '1']));
      if (!matches.length) matches = findSteps(fillPlaceholders(sub.text, numbers));
      if (!matches.length) {
        const leftOut = leftOutMessage(
          sub.text,
          leftOutStep(sub.text) ?? leftOutStep(fillPlaceholders(sub.text, numbers)),
        );
        if (leftOut) {
          errors.push(`${subWhere}: ${leftOut}`);
          continue;
        }
        const suggestion = suggestionsFor(sub.text)[0];
        const missingType = elementTypeHint(sub.text);
        errors.push(
          `${subWhere}: No step matches "${sub.text}".` +
            (missingType ? ` ${missingType}` : suggestion ? ` Did you mean "${suggestion}"?` : ''),
        );
        continue;
      }
      if (matches.length > 1) {
        errors.push(
          `${subWhere}: "${sub.text}" matches ${matches.length} steps: ${matches
            .map(({ step }) => `"${step.pattern}"`)
            .join(', ')}.`,
        );
        continue;
      }
      const target = matches[0].step;
      const unsupported = target.fixtures.filter((name) => !KEYWORD_FIXTURES.includes(name));
      if (unsupported.length) {
        errors.push(
          `${subWhere}: The step "${target.pattern}" uses the fixture(s) ${unsupported.join(', ')}. ` +
            `Steps inside keywords may only use ${KEYWORD_FIXTURES.join(' and ')}.`,
        );
      }
      const called = keywordOfStep.get(target);
      if (called) calls.get(keyword)!.add(called);
    }

    for (const name of keyword.params) {
      if (!used.has(name)) {
        errors.push(
          `${where}: The parameter <${name}> of "${keyword.title}" is not used in any step.`,
        );
      }
    }
  }

  errors.push(...findCycles(calls));
  return { errors, warnings };
}

/** The other steps the keyword's example also matches: they share its wording. */
export function sameWording(keyword: KeywordDefinition): StepDefinition[] {
  return findSteps(keyword.step.example)
    .map(({ step }) => step)
    .filter((step) => step !== keyword.step);
}

type ParsedKeyword = Omit<KeywordDefinition, 'step'> & {
  example: string;
  description: string;
  category: string;
};

function parseKeywordFile(file: string): ParsedKeyword[] {
  const rel = relative(file);
  const document = parseGherkin(fs.readFileSync(file, 'utf8'), rel);
  const feature = document.feature;
  if (!feature) return [];
  const dialect = dialects[feature.language];
  const errors: string[] = [];
  const result: ParsedKeyword[] = [];

  for (const child of feature.children) {
    if (child.background) {
      errors.push(
        `${rel}:${child.background.location.line}: Keyword files cannot have a Background.`,
      );
    }
    if (child.rule) {
      errors.push(`${rel}:${child.rule.location.line}: Keyword files cannot have a Rule.`);
    }
    const scenario = child.scenario;
    if (!scenario) continue;
    const where = `${rel}:${scenario.location.line}`;
    const title = scenario.name.trim();
    const parsed = titleToPattern(title);
    if ('error' in parsed) {
      errors.push(`${where}: ${parsed.error}`);
      continue;
    }
    // A keyword without values may be a plain Scenario; one with values needs an outline.
    if (parsed.params.length && !dialect.scenarioOutline.includes(scenario.keyword)) {
      errors.push(
        `${where}: A keyword with values is a "Scenario Outline:", not "${scenario.keyword}:".`,
      );
      continue;
    }
    if (!scenario.steps.length) {
      errors.push(`${where}: The keyword "${title}" has no steps.`);
      continue;
    }
    for (const step of scenario.steps) {
      if (step.docString) {
        errors.push(
          `${rel}:${step.location.line}: Doc strings are not supported in keywords yet. A data table is.`,
        );
      }
    }
    result.push({
      title,
      pattern: parsed.pattern,
      params: parsed.params,
      file,
      line: scenario.location.line,
      column: scenario.location.column ?? 1,
      steps: scenario.steps.map((step) => ({
        keyword: step.keyword.trim(),
        text: step.text,
        line: step.location.line,
        column: step.location.column ?? 1,
        ...(step.dataTable
          ? { table: step.dataTable.rows.map((row) => row.cells.map((cell) => cell.value)) }
          : {}),
      })),
      ...docsFor(scenario, title),
      category: feature.name.trim() || 'Keywords',
    });
  }

  if (errors.length) {
    throw new Error(`[plainwright] Invalid keyword file:\n${errors.join('\n')}`);
  }
  return result;
}

type ParsedScenario = {
  description: string;
  examples: readonly {
    tableHeader?: { cells: readonly { value: string }[] };
    tableBody: readonly { cells: readonly { value: string }[] }[];
  }[];
};

/** The example is the title filled with the first Examples row, if the keyword has one. */
function docsFor(scenario: ParsedScenario, title: string) {
  const header = scenario.examples[0]?.tableHeader?.cells.map((cell) => cell.value) ?? [];
  const row = scenario.examples[0]?.tableBody[0]?.cells.map((cell) => cell.value) ?? [];
  const values = Object.fromEntries(header.map((name, i) => [name, row[i] ?? '']));
  const description = scenario.description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
  return {
    example: row.length ? fillPlaceholders(title, values) : title,
    description: description || 'Runs the steps of this keyword.',
  };
}

function registerKeyword({ example, description, category, ...rest }: ParsedKeyword) {
  const keyword = rest as KeywordDefinition;
  const existing = getSteps().find((step) => step.pattern === keyword.pattern);
  if (existing) {
    throw new Error(
      `[plainwright] Invalid keyword file:\n${relative(keyword.file)}:${keyword.line}: ` +
        `The keyword "${keyword.title}" has the same wording as the step "${existing.pattern}"${formatLocation(existing.location)}.`,
    );
  }
  const step = registerStep(
    {
      pattern: keyword.pattern,
      description,
      example,
      category,
      level: 'core',
      // The destructured fixtures tell playwright-bdd which fixtures to pass.
      fn: async ({ page, world }: StepFixtures, ...args: unknown[]) => {
        await runKeyword(keyword, { page, world }, args);
      },
    },
    {
      source: 'keyword',
      location: { file: keyword.file, line: keyword.line, column: keyword.column },
      arityCheck: false,
      // The steps of the keyword fill in {references}, once the parameters are in place.
      values: 'none',
    },
  );
  Object.assign(keyword, { step });
  keywords.push(keyword);
  keywordOfStep.set(step, keyword);
  return keyword;
}

async function runKeyword(
  keyword: KeywordDefinition,
  fixtures: Pick<StepFixtures, 'page' | 'world'>,
  args: unknown[],
) {
  const values = Object.fromEntries(keyword.params.map((name, i) => [name, String(args[i])]));
  for (const sub of keyword.steps) {
    const text = fillPlaceholders(sub.text, values);
    const location = { file: keyword.file, line: sub.line, column: sub.column };
    await playwrightTest.step(
      `${sub.keyword} ${text}`,
      async () => {
        const matches = findSteps(text);
        if (matches.length !== 1) {
          throw new Error(
            `${relative(keyword.file)}:${sub.line}: ` +
              (matches.length
                ? `"${text}" matches ${matches.length} steps.`
                : `No step matches "${text}".`),
          );
        }
        const table = sub.table
          ? [
              new DataTable(
                sub.table.map((row) => row.map((cell) => fillPlaceholders(cell, values))),
              ),
            ]
          : [];
        await runAt(location, () =>
          matches[0].step.fn.call({}, fixtures, ...matches[0].args, ...table),
        );
      },
      { location },
    );
  }
}

/** `I log in as "<user>"` → `I log in as {string}` with params `['user']`. */
export function titleToPattern(
  title: string,
): { pattern: string; params: string[] } | { error: string } {
  const params: string[] = [];
  let pattern = '';
  let last = 0;
  for (const match of title.matchAll(/"<([^<>"]+)>"/g)) {
    const name = match[1];
    if (params.includes(name))
      return { error: `The parameter <${name}> appears twice in "${title}".` };
    params.push(name);
    pattern += escapeExpression(title.slice(last, match.index)) + '{string}';
    last = match.index! + match[0].length;
  }
  pattern += escapeExpression(title.slice(last));
  const unquoted = /<([^<>]+)>/.exec(title.replace(/"<([^<>"]+)>"/g, ''));
  if (unquoted) {
    return { error: `Write the parameter <${unquoted[1]}> in quotes: "<${unquoted[1]}>".` };
  }
  if (!title) return { error: 'A keyword needs a title.' };
  return { pattern, params };
}

function escapeExpression(text: string) {
  return text.replace(/[\\(){}/]/g, '\\$&');
}

function angleBrackets(text: string): string[] {
  return [...text.matchAll(/<([^<>"]+)>/g)].map((match) => match[1]);
}

/**
 * Replaces `<name>` with the value when `name` is a parameter; any other `<…>` stays.
 * Quotes in values are escaped, because `{string}` and `{element}` turn `\"` back into `"`.
 * Backslashes stay as they are: they only escape a quote.
 */
export function fillPlaceholders(text: string, values: Record<string, string>) {
  return text.replace(/<([^<>"]+)>/g, (whole, name: string) =>
    Object.hasOwn(values, name) ? values[name].replace(/"/g, '\\"') : whole,
  );
}

/** `<usrname>` for `<username>`: close, but not a short name like `<b>` next to `<a>`. */
function isMisspelling(name: string, param: string) {
  const distance = levenshtein(name.toLowerCase(), param.toLowerCase());
  return name !== param && distance <= 2 && distance * 2 < Math.max(name.length, param.length);
}

function findCycles(calls: Map<KeywordDefinition, Set<KeywordDefinition>>): string[] {
  const errors: string[] = [];
  const reported = new Set<KeywordDefinition>();
  const visit = (keyword: KeywordDefinition, trail: KeywordDefinition[]) => {
    const index = trail.indexOf(keyword);
    if (index >= 0) {
      const cycle = [...trail.slice(index), keyword];
      if (!cycle.some((k) => reported.has(k))) {
        cycle.forEach((k) => reported.add(k));
        errors.push(
          `${relative(keyword.file)}:${keyword.line}: Keywords call each other in a loop: ${cycle
            .map((k) => `"${k.title}"`)
            .join(' → ')}.`,
        );
      }
      return;
    }
    for (const next of calls.get(keyword) ?? []) visit(next, [...trail, keyword]);
  };
  for (const keyword of calls.keys()) visit(keyword, []);
  return errors;
}

function relative(file: string) {
  return path.relative(process.cwd(), file) || file;
}
