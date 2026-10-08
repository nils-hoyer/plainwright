import path from 'node:path';
import { ELEMENT_TYPES, LOOKUP_DESCRIPTION } from './elements';
import { keywordOf } from './keywords';
import { getPageDefinitions } from './pages';
import { getSteps, StepDefinition } from './registry';

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
  generator: 'playwright-keywords';
  rules: string[];
  elementTypes: { type: string; lookup: string }[];
  pages: { name: string; url?: string; aliases: string[] }[];
  steps: CatalogStep[];
};

/** The design rules every step follows. Also used in the agent instructions. */
export const RULES = [
  'Every value is in double quotes. Anything in quotes is data; the rest of the sentence is fixed.',
  'Elements are named by what the user sees: the "Log in" button, the "Email" field. No CSS, XPath or test IDs.',
  'One phrase per action. No synonyms.',
  'Every step does exactly what it says.',
  'Checks start with "I see" or "I do not see" and wait automatically. Avoid fixed waits.',
  'Given/When/Then are optional; * works everywhere.',
];

/** Everything an AI assistant (or a person) needs to write steps that exist: steps.json. */
export function buildCatalog(cwd = process.cwd()): Catalog {
  return {
    generator: 'playwright-keywords',
    rules: RULES,
    elementTypes: ELEMENT_TYPES.map((type) => ({
      type,
      lookup: LOOKUP_DESCRIPTION[type].replace(/ \(`.*`\)$/, ''),
    })),
    pages: getPageDefinitions().map((page) => ({
      name: page.name,
      url: page.url === undefined ? undefined : String(page.url),
      aliases: Object.keys(page.elements),
    })),
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
