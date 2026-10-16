// Public API of Plainwright.

export { test, useTest } from './fixtures';
export type { KeywordsFixtures, KeywordsOptions } from './fixtures';
export { World } from './world';
export type { DialogRecord, WorldOptions } from './world';
export { definePage, definePages, getPageDefinition, getPageDefinitions } from './pages';
export type { PageDefinition, PageOptions } from './pages';
export { ElementRef, ELEMENT_TYPES, locate } from './elements';
export type { ElementAlias, ElementType, Scope } from './elements';
export { defineStep, findStep, findSteps, getSteps } from './registry';
export type {
  StepDefinition,
  StepFixtures,
  StepFn,
  StepLevel,
  StepLocation,
  StepMatch,
  StepOptions,
  StepSource,
} from './registry';
export { defineParameterType } from './params';
export type { ParameterTypeOptions } from './params';
export { defineKeywords, getKeywords, validateKeywords } from './keywords';
export type { KeywordDefinition, KeywordStep } from './keywords';
export { defineData, remember } from './values';
export { aiFixPromptTemplate } from './ai';

/**
 * The file that defines the built-in steps and `test`. Add it to playwright-bdd's `steps`, so a
 * project needs no step file of its own:
 *
 *   defineBddConfig({ features: 'features/**\/*.feature', steps: ['steps/**\/*.ts', steps] })
 */
export const steps: string = __filename;

// Registers the built-in steps.
import './steps/navigation.steps';
import './steps/actions.steps';
import './steps/assertions.steps';
import './steps/dialogs.steps';
import './steps/tabs.steps';
import './steps/input.steps';
import './steps/scroll.steps';
import './steps/wait.steps';
import './steps/storage.steps';
import './steps/screenshot.steps';
import './steps/download.steps';
import './steps/data.steps';
import { loadProjectFiles } from './project';

// Loads .env, pages.json, data/ and keywords/ from the project folder.
loadProjectFiles();
