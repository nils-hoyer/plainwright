import type { TestType } from '@playwright/test';
import { createBdd, test as bddTest } from 'playwright-bdd';
import { keptSession } from './session';
import { World } from './world';

/** Plainwright's options under `use`. There are none since `exactNames` was removed in 0.3.0. */
export type KeywordsOptions = Record<never, never>;

export type KeywordsFixtures = {
  world: World;
};

/**
 * Checks that run once per worker before the first test, after all steps are loaded, e.g. that
 * the keywords are valid. A failed check fails every test with its error.
 */
export const workerChecks = new Set<() => void>();

/** The Playwright `test` with the `world` fixture. Extend it with `useTest()` to add your own fixtures. */
export const test = bddTest.extend<KeywordsOptions & KeywordsFixtures, { plainwrightChecks: void }>(
  {
    // Boxed, so it does not show up as a step in the report.
    plainwrightChecks: [
      async ({}, use) => {
        for (const check of workerChecks) check();
        await use();
      },
      { scope: 'worker', auto: true, box: true },
    ],
    // A scenario starts with the session that a @setup scenario kept (src/session.ts).
    storageState: async ({ storageState }, use, testInfo) => {
      await use(keptSession(testInfo.tags) ?? storageState);
    },
    world: async ({ page, baseURL }, use, testInfo) => {
      checkOptions(testInfo.project.use);
      const world = new World(page, { baseURL });
      await use(world);
      try {
        await world.runAfterTest();
      } finally {
        world.dispose();
      }
    },
  },
);

export const { Step } = createBdd(test);

/**
 * Makes playwright-bdd run every feature with your extended `test`, so your steps can use your
 * fixtures. Export the result from a step file:
 *
 *   export const test = useTest(
 *     base.extend<{ account: Account }>({
 *       account: async ({}, use) => use(await createAccount()),
 *     }),
 *   );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTest<T extends TestType<any, any>>(projectTest: T): T {
  // playwright-bdd imports the most extended `test` among the steps and hooks a feature uses.
  // Every step is bound to this package's `test`. A hook bound to the project's `test` applies
  // to every feature and makes that one the most extended.
  createBdd(projectTest).BeforeAll({ name: 'use project fixtures' }, () => {});
  return projectTest;
}

/** Options that Plainwright no longer has: fail with what replaces them. */
export function checkOptions(use: object | undefined) {
  if (use && 'exactNames' in use) {
    throw new Error(
      '[plainwright] exactNames was removed in 0.3.0: element names always match exactly, with ' +
        'the same capitals, so a step means the same in every project. Remove it from use in ' +
        'playwright.config.ts. For a name with a part that changes, such as "Cart (3)", add an ' +
        'alias: see docs/pages.md.',
    );
  }
}
