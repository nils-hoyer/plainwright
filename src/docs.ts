import { ELEMENT_TYPES, LOOKUP_DESCRIPTION } from './elements';
import { getSteps, StepDefinition } from './registry';
import { REMOVED_STEPS } from './removed';
import { CATEGORIES } from './steps/builtin';

/** Markdown tables of steps, core steps first, grouped by category. */
export function renderStepReference(
  steps: readonly StepDefinition[] = getSteps(),
  headingLevel = 3,
): string {
  const h = '#'.repeat(headingLevel);
  const sections: string[] = [];
  for (const level of ['core', 'advanced'] as const) {
    const ofLevel = steps.filter((step) => step.level === level);
    if (!ofLevel.length) continue;
    sections.push(
      `${h} ${level === 'core' ? 'Core steps' : 'Advanced steps'}`,
      level === 'core'
        ? 'The everyday vocabulary. Prefer these steps.'
        : 'For special cases. `lint` lists where they are used.',
    );
    for (const category of orderedCategories(ofLevel)) {
      sections.push(`${h}# ${category}`, table(ofLevel.filter((s) => s.category === category)));
    }
  }
  return sections.join('\n\n');
}

/** Markdown table of the steps a release removed, with what to write instead. */
export function renderRemovedSteps(headingLevel = 2): string {
  const rows = REMOVED_STEPS.map(
    ({ pattern, removedIn, instead }) => `| \`${pattern}\` | ${removedIn} | ${instead} |`,
  );
  return [
    `${'#'.repeat(headingLevel)} Removed steps`,
    'Steps a release removed, with what to write instead. `lint` says the same where one is still used.',
    ['| Step | Removed in | Instead |', '| --- | --- | --- |', ...rows].join('\n'),
  ].join('\n\n');
}

/**
 * Markdown table of element types and how each is found. `plain` leaves out the Playwright
 * calls, for readers who don't program.
 */
export function renderElementTypes({ plain = false } = {}): string {
  const rows = ELEMENT_TYPES.map((type) => {
    const lookup = plain ? plainLookup(LOOKUP_DESCRIPTION[type]) : LOOKUP_DESCRIPTION[type];
    return `| \`the "…" ${type}\` | ${lookup} |`;
  });
  return ['| Written as | Finds |', '| --- | --- |', ...rows].join('\n');
}

/** `a button with this name (\`getByRole('button')\`)` → `a button with this name`. */
export function plainLookup(lookup: string): string {
  return lookup.replace(/ \(`.*`\)$/, '');
}

/** Replaces the text between `<!-- generated:name -->` and `<!-- /generated:name -->`. */
export function replaceGenerated(document: string, name: string, content: string): string {
  const start = `<!-- generated:${name} -->`;
  const end = `<!-- /generated:${name} -->`;
  const from = document.indexOf(start);
  const to = document.indexOf(end);
  if (from < 0 || to < from) throw new Error(`Markers for "${name}" not found.`);
  return `${document.slice(0, from + start.length)}\n\n${content}\n\n${document.slice(to)}`;
}

function table(steps: StepDefinition[]): string {
  const rows = steps.map(
    (step) =>
      `| \`${cell(step.pattern)}\` | ${cell(step.description)} | \`${cell(step.example)}\` |`,
  );
  return ['| Step | What it does | Example |', '| --- | --- | --- |', ...rows].join('\n');
}

function orderedCategories(steps: StepDefinition[]): string[] {
  const builtIn: readonly string[] = CATEGORIES;
  const used = [...new Set(steps.map((step) => step.category))];
  return [
    ...builtIn.filter((category) => used.includes(category)),
    ...used.filter((category) => !builtIn.includes(category)),
  ];
}

function cell(text: string) {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
