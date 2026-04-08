import { createBdd } from 'playwright-bdd';
import { test as bddBase } from '../src/fixtures/world';
import {
  LoginPage,
  DashboardPage,
  FormsPage,
  InteractionsPage,
  AssertionsPage,
  DownloadPage,
  DragPage,
  FileChooserPage,
  MousePage,
  TouchPage,
} from './pages';

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
    world.registerPageObject('download', new DownloadPage());
    world.registerPageObject('drag', new DragPage());
    world.registerPageObject('filechooser', new FileChooserPage());
    world.registerPageObject('mouse', new MousePage());
    world.registerPageObject('touch', new TouchPage());
    await use(world);
  },
});

export const { Given, When, Then } = createBdd(test);
