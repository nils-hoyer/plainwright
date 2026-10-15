import fs from 'node:fs';
import path from 'node:path';
import { CucumberExpression, ParameterTypeRegistry } from '@cucumber/cucumber-expressions';
import { describe, expect, it } from 'vitest';
import { findSteps } from '../../src/index';
import { titleToPattern } from '../../src/keywords';

// Every sentence the README shows must be a real step, so readers can copy it.
const readme = fs.readFileSync(path.join(__dirname, '../../README.md'), 'utf8');

const gherkinSteps = [...readme.matchAll(/```gherkin\n([\s\S]*?)```/g)]
  .flatMap((block) => block[1].split('\n'))
  .map((line) => line.trim())
  .filter((line) => line.startsWith('* ') && !/<\w+>/.test(line))
  .map((line) => line.slice(2));

const inlineSentences = [...readme.matchAll(/`(I [^`…]+)`/g)].map((match) => match[1]);

// Keywords the README defines, e.g. I log in as "<username>" with password "<password>".
const keywords = [...readme.matchAll(/Scenario Outline: (.+)/g)].map((match) => {
  const parsed = titleToPattern(match[1].trim());
  if ('error' in parsed) throw new Error(parsed.error);
  return new CucumberExpression(parsed.pattern, new ParameterTypeRegistry());
});

describe('README', () => {
  it('shows sentences', () => {
    expect(gherkinSteps.length).toBeGreaterThan(5);
    expect(inlineSentences.length).toBeGreaterThan(5);
  });

  it.each([...new Set([...gherkinSteps, ...inlineSentences])])('"%s" is a step', (text) => {
    if (keywords.some((keyword) => keyword.match(text))) return;
    expect(findSteps(text).map(({ step }) => step.pattern)).toHaveLength(1);
  });
});
