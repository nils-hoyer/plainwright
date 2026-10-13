import type { World } from '../world';
import { registerStep, StepLevel } from '../registry';

/** Categories of built-in steps, in the order they appear in the docs. */
export const CATEGORIES = [
  'Pages and navigation',
  'Clicking and typing',
  'Checking what you see',
  'Dialogs',
  'Tabs and frames',
  'Keyboard, mouse and touch',
  'Scrolling',
  'Waiting',
  'Cookies and storage',
  'Screenshots',
  'Downloads',
] as const;

export type Category = (typeof CATEGORIES)[number];

type BuiltInOptions = {
  pattern: string;
  description: string;
  example: string;
  level: StepLevel;
  discouraged?: string;
  // Built-in steps only use the `world` fixture, which keeps them usable inside keywords.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (fixtures: { world: World }, ...args: any[]) => Promise<unknown> | unknown;
};

/** Returns a function that registers built-in steps of one category. */
export function category(name: Category) {
  return (options: BuiltInOptions) =>
    registerStep({ ...options, category: name }, { source: 'built-in' });
}

export { escapeRegExp } from '../elements';
