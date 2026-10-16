import type { TestType } from '@playwright/test';
import { createBdd, test as bddTest } from 'playwright-bdd';
import { World } from './world';

export type KeywordsOptions = {
  /** Match element names exactly (default `true`). Set `use: { exactNames: false }` for substring matches. */
  exactNames: boolean;
};

export type KeywordsFixtures = {
  world: World;
};

/** The Playwright `test` with the `world` fixture. Extend it with `useTest()` to add your own fixtures. */
export const test = bddTest.extend<KeywordsOptions & KeywordsFixtures>({
  exactNames: [true, { option: true }],
  world: async ({ page, baseURL, exactNames }, use) => {
    const world = new World(page, { baseURL, exactNames });
    await use(world);
    try {
      await world.runAfterTest();
    } finally {
      world.dispose();
    }
  },
});

export const { Step, BeforeAll } = createBdd(test);

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
