import { test as base, useTest, type StepFixtures } from '@nils.hoyer/plainwright';

// Your own fixtures: test data, API clients, a logged-in account …
type ProjectFixtures = {
  /** The todos the app saved in the browser's local storage. */
  savedTodos: () => Promise<{ title: string; completed: boolean }[]>;
};

/** Fixtures your steps can use: defineStep<Fixtures>({ fn: async ({ world, savedTodos }) => … }). */
export type Fixtures = StepFixtures & ProjectFixtures;

// playwright-bdd imports this `test` into the generated tests. useTest() makes it the `test` of
// every feature, so your steps get your fixtures.
export const test = useTest(
  base.extend<ProjectFixtures>({
    savedTodos: async ({ page }, use) => {
      await use(() => page.evaluate(() => JSON.parse(localStorage.getItem('todos') ?? '[]')));
    },
  }),
);
