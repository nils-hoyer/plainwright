import { describe, expect, it } from 'vitest';
import { defineStep, findStep, findSteps, getSteps } from '../../src/index';
import { CATEGORIES } from '../../src/steps/builtin';

const builtIn = getSteps().filter((step) => step.source === 'built-in');

describe('built-in steps', () => {
  it.each(builtIn.map((step) => [step.pattern, step] as const))(
    'the example of "%s" matches this step and no other',
    (_pattern, step) => {
      expect(findSteps(step.example).map((match) => match.step.pattern)).toEqual([step.pattern]);
    },
  );

  it('have a one-sentence description and a known category', () => {
    for (const step of builtIn) {
      expect(step.description, step.pattern).toMatch(/^[A-Z].*\.$/);
      expect(CATEGORIES as readonly string[], step.pattern).toContain(step.category);
    }
  });

  it('put every value in quotes: no {int}, {float} or {word} parameters', () => {
    for (const step of builtIn) {
      expect(step.parameters, step.pattern).not.toContain('int');
      expect(step.parameters, step.pattern).not.toContain('float');
      expect(step.parameters, step.pattern).not.toContain('word');
    }
  });

  it('start every check with "I see" or "I do not see"', () => {
    const checks = builtIn.filter(
      (step) => step.category === 'Checking what you see' || /^I (do not )?see/.test(step.pattern),
    );
    for (const step of checks) expect(step.pattern).toMatch(/^I (do not )?see /);
  });

  it('keep the core vocabulary small', () => {
    const core = builtIn.filter((step) => step.level === 'core');
    expect(core.length).toBeGreaterThanOrEqual(30);
    expect(core.length).toBeLessThanOrEqual(40);
  });

  it('only use the world fixture, so they work inside keywords', () => {
    for (const step of builtIn) expect(step.fixtures, step.pattern).toEqual(['world']);
  });
});

describe('findStep', () => {
  it('returns the step and the converted arguments', () => {
    const { step, args } = findStep('I fill "secret" in the "Password" field');
    expect(step.pattern).toBe('I fill {string} in the {element}');
    expect(args[0]).toBe('secret');
    expect(String(args[1])).toBe('"Password" field');
  });

  it('converts quoted numbers', () => {
    expect(findStep('I see "3" items in the "Accounts" list').args[0]).toBe(3);
  });

  it('suggests similar steps when nothing matches', () => {
    expect(() => findStep('I clik the "Log in" button')).toThrow(
      /No step matches "I clik the "Log in" button"\.\nDid you mean:\n {2}- I click the "Log in" button/,
    );
  });

  it('lists all matches when the text is ambiguous', () => {
    defineStep({
      pattern: 'I click the {string} thing',
      description: 'Test step.',
      example: 'I click the "x" thing',
      fn: () => {},
    });
    defineStep({
      pattern: 'I click the {word} thing',
      description: 'Test step.',
      example: 'I click the abc thing',
      fn: () => {},
    });
    expect(() => findStep('I click the "x" thing')).toThrow(/matches 2 steps/);
  });
});

describe('defineStep', () => {
  it('records metadata, fixtures and the caller location', () => {
    const step = defineStep({
      pattern: 'I add {string} to the cart',
      description: 'Adds a product to the cart.',
      example: 'I add "Coffee" to the cart',
      fn: async ({ page, world }, _product: string) => {
        void page;
        void world;
      },
    });
    expect(step).toMatchObject({
      source: 'project',
      level: 'core',
      category: 'Project steps',
      parameters: ['string'],
      fixtures: ['page', 'world'],
    });
    expect(step.location?.file).toContain('registry.test.ts');
  });

  it('rejects steps without description or example', () => {
    expect(() =>
      defineStep({ pattern: 'I do things', description: '', example: 'x', fn: () => {} }),
    ).toThrow(/needs a non-empty "description"/);
  });

  it('rejects a pattern that is already defined', () => {
    expect(() =>
      defineStep({ pattern: 'I reload the page', description: 'x.', example: 'x', fn: () => {} }),
    ).toThrow(/defined twice/);
  });
});
