/**
 * This file intentionally re-exports all generic steps from src/steps/
 * so that playwright-bdd picks them up when running tests in the test/ folder.
 *
 * All steps are automatically registered by importing src/index.ts.
 */
import '../../src/index';
