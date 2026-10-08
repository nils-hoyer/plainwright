import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { titleToPattern } from '../../src/keywords';

const fixtures = path.join(__dirname, 'fixtures/keywords');

/** Fresh registries for every test: keywords and steps are module state. */
async function load(dir: string) {
  vi.resetModules();
  const library = await import('../../src/index');
  return { library, define: () => library.defineKeywords(`${dir}/*.feature`, { cwd: fixtures }) };
}

describe('titleToPattern', () => {
  it('turns "<name>" into {string}', () => {
    expect(titleToPattern('I log in as "<user>" with password "<password>"')).toEqual({
      pattern: 'I log in as {string} with password {string}',
      params: ['user', 'password'],
    });
  });

  it('escapes characters that mean something in step patterns', () => {
    expect(titleToPattern('I pay (by card) and/or {cash}')).toEqual({
      pattern: 'I pay \\(by card\\) and\\/or \\{cash\\}',
      params: [],
    });
  });

  it('requires quotes around parameters', () => {
    expect(titleToPattern('I log in as <user>')).toEqual({
      error: 'Write the parameter <user> in quotes: "<user>".',
    });
  });

  it('rejects a parameter used twice', () => {
    expect(titleToPattern('I copy "<a>" to "<a>"')).toEqual({
      error: 'The parameter <a> appears twice in "I copy "<a>" to "<a>"".',
    });
  });
});

describe('defineKeywords', () => {
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(__dirname, '../..'));
  });

  it('registers each Scenario Outline as a step', async () => {
    const { library, define } = await load('valid');
    define();
    const { step, args } = library.findStep('I log in as "jane" with password "pw"');
    expect(args).toEqual(['jane', 'pw']);
    expect(step).toMatchObject({
      pattern: 'I log in as {string} with password {string}',
      description: 'Logs in on the login page.',
      example: 'I log in as "1234567890" with password "secret"',
      category: 'Account',
      source: 'keyword',
      level: 'core',
      fixtures: ['page', 'world'],
    });
    expect(step.location).toMatchObject({ line: 3 });
    expect(library.validateKeywords()).toEqual([]);
  });

  it('reports steps that match nothing, unknown and unused parameters', async () => {
    const { library, define } = await load('broken-steps');
    define();
    const file = 'test/unit/fixtures/keywords/broken-steps/broken.feature';
    expect(library.validateKeywords()).toEqual([
      `${file}:5: No step matches "I clik the "Search" button". Did you mean "I click the "Log in" button"?`,
      `${file}:6: Unknown parameter <query>. The title of "I search for "<term>"" defines: <term>.`,
      `${file}:3: The parameter <term> of "I search for "<term>"" is not used in any step.`,
      `${file}:8: The parameter <email> of "I sign up as "<name>" with "<email>"" is not used in any step.`,
    ]);
  });

  it('reports keywords that call each other in a loop', async () => {
    const { library, define } = await load('cycle');
    define();
    expect(library.validateKeywords()).toEqual([
      'test/unit/fixtures/keywords/cycle/cycle.feature:3: Keywords call each other in a loop: "I do the first thing" → "I do the second thing" → "I do the first thing".',
    ]);
  });

  it('reports a keyword whose wording also matches another step', async () => {
    const { library, define } = await load('collision');
    define();
    expect(library.validateKeywords()).toEqual([
      'test/unit/fixtures/keywords/collision/collision.feature:3: The keyword "I see the "<title>" heading" has the same wording as the step "I see the {element}".',
    ]);
  });

  it('fails at load time when a keyword repeats the pattern of a step', async () => {
    const { define } = await load('duplicate');
    expect(define).toThrow(
      'test/unit/fixtures/keywords/duplicate/duplicate.feature:3: The keyword "I reload the page" has the same wording as the step "I reload the page".',
    );
  });

  it('fails at load time when a keyword is not a Scenario Outline', async () => {
    const { define } = await load('not-outline');
    expect(define).toThrow(
      'test/unit/fixtures/keywords/not-outline/scenario.feature:3: Write keywords as "Scenario Outline:", not "Scenario:".',
    );
  });

  it('fails at load time when a title parameter has no quotes', async () => {
    const { define } = await load('unquoted');
    expect(define).toThrow(
      'test/unit/fixtures/keywords/unquoted/unquoted.feature:3: Write the parameter <username> in quotes: "<username>".',
    );
  });

  it('fails when no file matches', async () => {
    const { define } = await load('missing-directory');
    expect(define).toThrow(/found no files/);
  });
});
