import { afterAll, describe, expect, it } from 'vitest';
import { defineConfig } from '../../src/config';

const before = process.env.PLAYWRIGHT_BDD_CONFIGS;
afterAll(() => {
  if (before === undefined) delete process.env.PLAYWRIGHT_BDD_CONFIGS;
  else process.env.PLAYWRIGHT_BDD_CONFIGS = before;
});

describe('defineConfig', () => {
  // playwright-bdd needs a separate output folder for each configuration in one process.
  it('stores screenshots to compare against next to the feature files', () => {
    expect(defineConfig({ bdd: { outputDir: '.gen-1' } }).snapshotDir).toBe('.');
    expect(defineConfig({ bdd: { outputDir: '.gen-2', featuresRoot: 'test' } }).snapshotDir).toBe(
      'test',
    );
    expect(defineConfig({ bdd: { outputDir: '.gen-3' }, snapshotDir: 'shots' }).snapshotDir).toBe(
      'shots',
    );
  });
});
