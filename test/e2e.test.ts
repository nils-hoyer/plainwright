import * as childProcess from 'child_process';
import * as util from 'util';
import { describe, expect, it } from 'vitest';

const exec = util.promisify(childProcess.exec);

describe('Playwright BDD step definitions', () => {
  it('all tests pass', async () => {
    let stdout = '';

    try {
      const result = await exec('npx bddgen && npx playwright test');
      stdout = result.stdout;
    } catch (error: any) {
      throw new Error(`Tests failed:\n${error.stdout ?? ''}\n${error.stderr ?? ''}`);
    }

    expect(stdout).toMatch(/\d+ passed/);
    expect(stdout).not.toMatch(/\d+ failed/);
  });
});
