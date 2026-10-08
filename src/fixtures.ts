import { createBdd, test as bddTest } from 'playwright-bdd';
import { World } from './world';

export type KeywordsOptions = {
  /** Match element names exactly (default `true`). Set `use: { exactNames: false }` for substring matches. */
  exactNames: boolean;
};

export type KeywordsFixtures = {
  world: World;
};

/** The Playwright `test` with the `world` fixture. Extend it to add your own fixtures. */
export const test = bddTest.extend<KeywordsOptions & KeywordsFixtures>({
  exactNames: [true, { option: true }],
  world: async ({ page, baseURL, exactNames }, use) => {
    const world = new World(page, { baseURL, exactNames });
    await use(world);
    world.dispose();
  },
});

export const { Step, BeforeAll } = createBdd(test);
