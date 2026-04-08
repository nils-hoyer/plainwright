import { createBdd } from 'playwright-bdd';
import { test as bddBase } from '../src/fixtures/world';
import { LoginPage, DashboardPage, FormsPage, InteractionsPage, AssertionsPage } from './pages';

/**
 * Extend the BDD world fixture to pre-register all page objects.
 * Import this `test` in every step file under test/.
 */
export const test = bddBase.extend<{}>({
  world: async ({ world }, use) => {
    world.registerPageObject('login', new LoginPage());
    world.registerPageObject('dashboard', new DashboardPage());
    world.registerPageObject('forms', new FormsPage());
    world.registerPageObject('interactions', new InteractionsPage());
    world.registerPageObject('assertions', new AssertionsPage());
    await use(world);
  },
});

export const { Given, When, Then } = createBdd(test);
