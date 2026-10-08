import { test as base, useTest, type StepFixtures } from '../../src/index';

// playwright-bdd imports the `test` exported here into the generated test files.
// useTest() makes it the `test` of every feature, so steps can use the fixtures added here.

type TestUser = { username: string; password: string };
type ProjectFixtures = { testUser: TestUser };

/** Fixtures for project steps: defineStep<Fixtures>({ fn: async ({ world, testUser }) => … }). */
export type Fixtures = StepFixtures & ProjectFixtures;

export const test = useTest(
  base.extend<ProjectFixtures>({
    testUser: async ({}, use) => use({ username: '1234567890', password: 'password123' }),
  }),
);
