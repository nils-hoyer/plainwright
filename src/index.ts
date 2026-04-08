// Re-export the extended test fixture so consumers can use the same world
export { test, Given, When, Then } from './fixtures/world';
export type { World } from './fixtures/world';

// Re-export BasePage so consumers can extend it
export { BasePage } from './pages/BasePage';

// Re-export utilities
export { resolveSelector, labelToPropertyName } from './utils/selector';

// Import all step definitions so they are registered when this package is imported
import './steps/navigation.steps';
import './steps/pageobject.steps';
import './steps/click.steps';
import './steps/form.steps';
import './steps/visibility.steps';
import './steps/attributes.steps';
import './steps/scroll.steps';
import './steps/wait.steps';
import './steps/tabs.steps';
import './steps/dialogs.steps';
import './steps/screenshot.steps';
import './steps/keyboard.steps';
import './steps/frames.steps';
import './steps/storage.steps';
import './steps/assertions.steps';
import './steps/download.steps';
import './steps/mouse.steps';
import './steps/drag.steps';
import './steps/filechooser.steps';
import './steps/touchscreen.steps';
