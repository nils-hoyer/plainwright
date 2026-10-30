import type { World } from '../world';
import { registerStep, StepLevel } from '../registry';

/** Categories of built-in steps, in the order they appear in the docs. */
export const CATEGORIES = [
  'Pages and navigation',
  'Clicking and typing',
  'Checking what you see',
  'Dialogs',
  'Tabs and frames',
  'Scrolling',
  'Waiting',
  'Cookies and storage',
  'Screenshots',
  'Downloads',
  'Remembering values',
  'API requests',
] as const;

export type Category = (typeof CATEGORIES)[number];

type BuiltInOptions = {
  pattern: string;
  description: string;
  example: string;
  level: StepLevel;
  discouraged?: string;
  /** `raw`: a value that is exactly one `{reference}` arrives as is, e.g. an object. */
  values?: 'raw';
  /** The name the step remembers a value under, from its arguments. Lets lint check `{name}`. */
  remembers?: (args: unknown[]) => string;
  // Built-in steps only use the `world` fixture, which keeps them usable inside keywords.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (fixtures: { world: World }, ...args: any[]) => Promise<unknown> | unknown;
};

/** Returns a function that registers built-in steps of one category. */
export function category(name: Category) {
  return ({ values, ...options }: BuiltInOptions) =>
    registerStep({ ...options, category: name }, { source: 'built-in', values });
}

export { escapeRegExp } from '../elements';
