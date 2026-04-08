import { Page, Locator } from '@playwright/test';

/**
 * Base class for all Page Objects.
 *
 * How to define selectors:
 *   - Property name (camelCase) = the BDD step name (space-separated, lowercase)
 *   - Value = CSS selector   →  'button[type="submit"]'
 *             XPath          →  '//*[@data-testid="submit"]'
 *             Text           →  'text=Click me'
 *             Role           →  'role=button[name="Submit"]'
 *
 * Example:
 *   class LoginPage extends BasePage {
 *     buttonLogin = 'button[data-testid="submit"]';
 *     inputUsername = 'input[name="username"]';
 *   }
 *
 * In a .feature file you can then write:
 *   When I click the "button login"
 *   When I fill "hello" in the "input username"
 */
export abstract class BasePage {
  /**
   * Each concrete page must declare its own selectors as plain string properties.
   * This index signature allows the resolver to look them up by sanitised name.
   */
  [key: string]: string | Page | ((...args: unknown[]) => unknown);
}
