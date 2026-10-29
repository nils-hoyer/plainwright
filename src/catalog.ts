import path from 'node:path';
import { plainLookup } from './docs';
import { ELEMENT_TYPES, LOOKUP_DESCRIPTION } from './elements';
import { keywordOf } from './keywords';
import { getPageDefinitions } from './pages';
import { getSteps, StepDefinition } from './registry';
import { getDataFiles } from './values';

export type CatalogStep = {
  pattern: string;
  description: string;
  example: string;
  category: string;
  level: StepDefinition['level'];
  source: StepDefinition['source'];
  parameters: { type: string; name?: string }[];
  discouraged?: string;
  location?: string;
};

export type Catalog = {
  generator: 'plainwright';
  rules: string[];
  elementTypes: { type: string; lookup: string }[];
  pages: { name: string; url?: string; aliases: string[] }[];
  /** Values a step can write as `{name}` inside quotes: data files and the built-in ones. */
  values: CatalogValue[];
  steps: CatalogStep[];
};

export type CatalogValue = {
  /** Written `{name}`, e.g. `users.admin.email`. */
  name: string;
  source: 'data' | 'built-in';
  description?: string;
  /** The data file it comes from. */
  file?: string;
};

const BUILT_IN_VALUES: CatalogValue[] = [
  {
    name: 'env.NAME',
    source: 'built-in',
    description: 'The environment variable NAME, also from .env.',
  },
  {
    name: 'unique',
    source: 'built-in',
    description: 'A short text that is different in every test, the same within one test.',
  },
  {
    name: 'today',
    source: 'built-in',
    description:
      "Today's date as YYYY-MM-DD. Every date has parts: today.local as the browser writes it, today.day, today.month, today.year.",
  },
  {
    name: 'tomorrow',
    source: 'built-in',
    description: "Tomorrow's date, with the parts of today.",
  },
  {
    name: 'yesterday',
    source: 'built-in',
    description: "Yesterday's date, with the parts of today.",
  },
  {
    name: 'in-N-days',
    source: 'built-in',
    description: 'The date N days from today, such as in-7-days, with the parts of today.',
  },
  {
    name: 'N-days-ago',
    source: 'built-in',
    description: 'The date N days before today, such as 7-days-ago, with the parts of today.',
  },
  {
    name: 'response',
    source: 'built-in',
    description: 'The answer to the last request a step sent.',
  },
];

/** The design rules every step follows. Also used in the agent instructions. */
export const RULES = [
  'Every value is in double quotes. Anything in quotes is data; the rest of the sentence is fixed.',
  'Elements are named by what the user sees: the "Log in" button, the "Email" field. No CSS, XPath or test IDs.',
  'When a name repeats, name the element it is in: the "Delete" button in the "Order 1001" row.',
  'One phrase per action. No synonyms.',
  'Every step does exactly what it says.',
  'Checks start with "I see" or "I do not see" and wait automatically. Avoid fixed waits.',
  'Given/When/Then are optional; * works everywhere.',
  'A value from a data file, the environment or remembered earlier is written {name.path} inside the quotes: "{users.admin.email}". \\{ is a literal brace.',
];

/** Everything an AI assistant (or a person) needs to write steps that exist: steps.json. */
export function buildCatalog(cwd = process.cwd()): Catalog {
  return {
    generator: 'plainwright',
    rules: RULES,
    elementTypes: ELEMENT_TYPES.map((type) => ({
      type,
      lookup: plainLookup(LOOKUP_DESCRIPTION[type]),
    })),
    pages: getPageDefinitions().map((page) => ({
      name: page.name,
      url: page.url === undefined ? undefined : String(page.url),
      aliases: Object.keys(page.elements),
    })),
    values: [
      ...getDataFiles().flatMap(({ name, file, value }) =>
        valuePaths(name, value).map((valuePath) => ({
          name: valuePath,
          source: 'data' as const,
          file: path.relative(cwd, file),
        })),
      ),
      ...BUILT_IN_VALUES,
    ],
    steps: getSteps().map((step) => {
      const keyword = keywordOf(step);
      return {
        pattern: step.pattern,
        description: step.description,
        example: step.example,
        category: step.category,
        level: step.level,
        source: step.source,
        parameters: step.parameters.map((type, i) => ({
          type,
          ...(keyword ? { name: keyword.params[i] } : {}),
        })),
        ...(step.discouraged ? { discouraged: step.discouraged } : {}),
        ...(step.location && step.source !== 'built-in'
          ? { location: `${path.relative(cwd, step.location.file)}:${step.location.line}` }
          : {}),
      };
    }),
  };
}

/** The name of a data file and every value in it: `users`, `users.admin`, `users.admin.email`. */
function valuePaths(name: string, value: unknown, limit = 500): string[] {
  const paths = [name];
  const visit = (prefix: string, current: unknown) => {
    if (!current || typeof current !== 'object') return;
    for (const [key, item] of Object.entries(current)) {
      if (paths.length >= limit) return;
      paths.push(`${prefix}.${key}`);
      visit(`${prefix}.${key}`, item);
    }
  };
  visit(name, value);
  return paths;
}
