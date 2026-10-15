// Regenerates the parts of the docs that come from the step registry.
//   npm run docs          writes the files
//   npm run docs:check    fails when a file is out of date (used in CI)
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { renderElementTypes, renderStepReference, replaceGenerated } from '../src/docs';
import { getSteps } from '../src/index';

const root = path.join(__dirname, '..');
const check = process.argv.includes('--check');
const builtIn = getSteps().filter((step) => step.source === 'built-in');
const core = builtIn.filter((step) => step.level === 'core');

const agentInstructions = fs.readFileSync(path.join(root, 'templates/AGENTS.md'), 'utf8');
const agentBody = agentInstructions.replace(/^# .*\n+/, '');

type Target = { file: string; sections?: Record<string, string>; content?: string };

const targets: Target[] = [
  { file: 'docs/setup.md', sections: { 'element-types': renderElementTypes() } },
  {
    file: 'docs/steps.md',
    content: [
      '<!-- Generated from the step registry by npm run docs. Do not edit. -->',
      '# Step reference',
      [
        'Every built-in step, with what it does and an example. Your own steps and keywords are',
        'listed by `npx plainwright docs --steps "steps/**/*.ts"`. How to write elements',
        'is in the [README](../README.md#write-your-first-test).',
      ].join('\n'),
      renderStepReference(builtIn, 2),
    ].join('\n\n'),
  },
  {
    file: 'docs/reading-tests.md',
    sections: { 'element-types': renderElementTypes({ plain: true }) },
  },
  {
    file: 'docs/vocabulary.md',
    sections: { 'core-steps': core.map((step) => `- \`${step.example}\``).join('\n') },
  },
  // The starter, Copilot and Claude templates repeat AGENTS.md.
  { file: 'examples/starter/AGENTS.md', content: agentInstructions },
  {
    file: 'templates/copilot-instructions.md',
    content: `<!-- Generated from templates/AGENTS.md by npm run docs. Copy to .github/copilot-instructions.md. -->\n\n# Copilot instructions: browser tests\n\n${agentBody}`,
  },
  {
    file: 'templates/claude-skill/SKILL.md',
    content: `---\nname: plainwright\ndescription: Write, lint and fix readable browser tests (Gherkin feature files) with Plainwright. Use when adding or changing tests in features/.\n---\n\n<!-- Generated from templates/AGENTS.md by npm run docs. Copy to .claude/skills/plainwright/SKILL.md. -->\n\n# Writing browser tests with Plainwright\n\n${agentBody}`,
  },
];

async function main() {
  const outdated: string[] = [];
  for (const target of targets) {
    const file = path.join(root, target.file);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    let next = target.content ?? current;
    for (const [name, content] of Object.entries(target.sections ?? {})) {
      next = replaceGenerated(next, name, content);
    }
    const options = (await prettier.resolveConfig(file)) ?? {};
    next = await prettier.format(next, { ...options, filepath: file });
    if (next === current) continue;
    outdated.push(target.file);
    if (!check) fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!check) fs.writeFileSync(file, next);
  }
  if (check && outdated.length) {
    console.error(`Out of date: ${outdated.join(', ')}. Run "npm run docs" and commit the result.`);
    process.exitCode = 1;
  } else {
    console.log(outdated.length ? `Updated ${outdated.join(', ')}` : 'Docs are up to date.');
  }
}

main();
