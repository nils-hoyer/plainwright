import { ELEMENT_TYPES, LOOKUP_DESCRIPTION } from './elements';
import { getSteps, StepDefinition } from './registry';
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

/** Markdown table of element types and how each is found. */
export function renderElementTypes(): string {
  const rows = ELEMENT_TYPES.map((type) => `| \`the "…" ${type}\` | ${LOOKUP_DESCRIPTION[type]} |`);
  return ['| Written as | Finds |', '| --- | --- |', ...rows].join('\n');
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
