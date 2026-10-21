import path from 'node:path';
import { test } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { defineStep, findStep, findSteps, getSteps, steps } from '../../src/index';
import {
  parseStackFrame,
  registerStep,
  suggestionFor,
  suggestSteps,
  tagsFromPath,
} from '../../src/registry';
import { CATEGORIES, rememberedName } from '../../src/steps/builtin';
import { checkRememberName } from '../../src/values';

const builtIn = getSteps().filter((step) => step.source === 'built-in');

describe('built-in steps', () => {
  it.each(builtIn.map((step) => [step.pattern, step] as const))(
    'the example of "%s" matches this step and no other',
    (_pattern, step) => {
      expect(findSteps(step.example).map((match) => match.step.pattern)).toEqual([step.pattern]);
    },
  );

  it('remember values in their examples under names that braces can refer to', () => {
    for (const step of builtIn) {
      const name = rememberedName(step, findSteps(step.example)[0].args);
      if (name !== undefined) expect(checkRememberName(name), step.example).toBeNull();
    }
  });

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

describe('parseStackFrame', () => {
  it.each([
    ['    at Object.<anonymous> (/home/jane/app/steps/a.ts:3:5)', '/home/jane/app/steps/a.ts'],
    ['    at /home/jane/app/steps/a.ts:3:5', '/home/jane/app/steps/a.ts'],
    [
      '    at Object.<anonymous> (/home/jane/my app/steps/a.ts:3:5)',
      '/home/jane/my app/steps/a.ts',
    ],
    ['    at /home/jane/my app (copy)/steps/a.ts:3:5', '/home/jane/my app (copy)/steps/a.ts'],
    ['    at fn (/home/jane/[id]/steps (old)/a.ts:3:5)', '/home/jane/[id]/steps (old)/a.ts'],
    ['    at file:///home/jane/my%20app/steps/a.ts:3:5', '/home/jane/my app/steps/a.ts'],
    ['    at async fn (file:///home/jane/%5Bid%5D/a.ts:3:5)', '/home/jane/[id]/a.ts'],
  ])('%s', (frame, file) => {
    expect(parseStackFrame(frame)).toEqual({ file, line: 3, column: 5 });
  });

  it('returns nothing for frames without a file', () => {
    expect(parseStackFrame('    at async Promise.all (index 0)')).toBeUndefined();
  });
});

describe('tagsFromPath', () => {
  const cwd = '/home/jane/app';

  it('collects tags from folder and file names', () => {
    expect(tagsFromPath('/home/jane/app/steps/@admin/@beta-users.steps.ts', cwd)).toEqual([
      '@admin',
      '@beta-users',
    ]);
    expect(tagsFromPath('/home/jane/app/steps/users.steps.ts', cwd)).toEqual([]);
  });

  it('ignores folders above the project and in node_modules', () => {
    expect(tagsFromPath('/home/@jane/app/steps/a.ts', '/home/@jane/app')).toEqual([]);
    expect(tagsFromPath('/home/jane/app/node_modules/@scope/lib/steps.ts', cwd)).toEqual([]);
  });
});

describe('steps in tagged folders', () => {
  const define = (folder: string) =>
    registerStep(
      {
        pattern: 'I open the tagged start page',
        description: 'Test step.',
        example: 'I open the tagged start page',
        fn: () => {},
      },
      {
        source: 'project',
        location: {
          file: path.join(process.cwd(), `steps/${folder}/start.ts`),
          line: 1,
          column: 1,
        },
      },
    );

  it('apply only to scenarios with the tags of their folder', () => {
    const admin = define('@admin');
    const guest = define('@guest');
    const found = (tags?: string[]) =>
      findSteps('I open the tagged start page', tags).map((match) => match.step);
    expect(admin.tags).toEqual(['@admin']);
    expect(found(['@admin'])).toEqual([admin]);
    expect(found(['@guest', '@smoke'])).toEqual([guest]);
    expect(found([])).toEqual([]);
    expect(found()).toEqual([admin, guest]);
  });

  it('may share their wording with steps for other tags only', () => {
    expect(() => define('@admin')).toThrow(/defined twice/);
  });

  const project = (pattern: string, folder: string, fn: () => unknown = () => {}) =>
    registerStep(
      { pattern, description: 'Test step.', example: pattern, fn },
      {
        source: 'project',
        location: { file: path.join(process.cwd(), `steps/${folder}start.ts`), line: 1, column: 1 },
      },
    );

  it('win over steps without tags, as in playwright-bdd', () => {
    const plain = project('I open the overridden start page', '');
    const admin = project('I open the overridden start page', '@admin/');
    const found = (tags: string[]) =>
      findSteps('I open the overridden start page', tags).map((match) => match.step);
    expect(found(['@admin'])).toEqual([admin]);
    expect(found(['@guest'])).toEqual([plain]);
    expect(found([])).toEqual([plain]);
  });

  it('fail in a scenario without the tags of their folder', async () => {
    const step = project('I open the guarded start page', '@admin/', () => 'opened');
    const info = vi.spyOn(test, 'info');
    try {
      info.mockReturnValue({ tags: ['@admin', '@smoke'] } as never);
      await expect(step.fn({})).resolves.toBe('opened');
      info.mockReturnValue({ tags: [] } as never);
      await expect(step.fn({})).rejects.toThrow(
        '"I open the guarded start page" only applies to scenarios tagged @admin, the folder of its step file.',
      );
    } finally {
      info.mockRestore();
    }
  });
});

describe('steps', () => {
  // playwright-bdd loads this file to find the built-in steps and `test`.
  it('is the file of the package entry', () => {
    expect(path.basename(steps, path.extname(steps))).toBe('index');
  });
});

describe('suggestions', () => {
  it('keep the values of the misspelled step', () => {
    const text = 'I clik the "Add" button';
    expect(suggestionFor(suggestSteps(text)[0], text)).toBe('I click the "Add" button');
  });

  it('use the example when the values do not fit', () => {
    const text = 'I wiat "a few" seconds';
    expect(suggestionFor(suggestSteps(text)[0], text)).toBe(suggestSteps(text)[0].example);
  });
});
