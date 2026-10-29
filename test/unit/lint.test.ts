import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { renderElementTypes, renderStepReference, replaceGenerated } from '../../src/docs';
import { getSteps } from '../../src/index';
import { formatLintMessage, lintFeatures, summarize } from '../../src/lint';
import { registerStep } from '../../src/registry';

const root = path.join(__dirname, '../..');

describe('lint', () => {
  const messages = lintFeatures([path.join(__dirname, 'fixtures/lint/problems.feature')], root);
  const file = 'test/unit/fixtures/lint/problems.feature';

  it('reports problems as file:line: severity: message', () => {
    expect(messages.map(formatLintMessage)).toEqual([
      `${file}:4: error: "https://example.com/login" is an absolute URL. Use a page name (I open the "..." page) or a URL relative to baseURL. (absolute-url)`,
      `${file}:5: error: "#submit" looks like a selector. Name the element by what the user sees, or add an alias in the page's file in pages/. (selector)`,
      `${file}:6: error: Unknown step "I clik the "Log in" button". Did you mean "I click the "Log in" button"? (undefined-step)`,
      `${file}:7: error: "[data-testid='username']" looks like a selector. Name the element by what the user sees, or add an alias in the page's file in pages/. (selector)`,
      `${file}:8: warning: Fixed waits slow tests down and still break on slow days. Check for what the user waits for instead, e.g. I see the text "...". (discouraged-step)`,
      `${file}:8: info: "I wait {number} second(s)" is an advanced step. (advanced-step)`,
      `${file}:9: info: "I focus on the {element}" is an advanced step. (advanced-step)`,
      `${file}:10: error: ".order-row" looks like a selector. Name the element by what the user sees, or add an alias in the page's file in pages/. (selector)`,
    ]);
  });

  it('reports a name to remember that braces cannot refer to', () => {
    const errors = lintFeatures([path.join(__dirname, 'fixtures/lint/remember.feature')], root)
      .filter((message) => message.severity === 'error')
      .map(formatLintMessage);
    expect(errors).toEqual([
      `test/unit/fixtures/lint/remember.feature:4: error: "order number" cannot be remembered: a name may only contain letters, digits, - and _, such as "order-number". (remember-name)`,
    ]);
  });

  it('checks the values in the cells of a data table', () => {
    const errors = lintFeatures([path.join(__dirname, 'fixtures/lint/table.feature')], root)
      .filter((message) => message.severity === 'error')
      .map(formatLintMessage);
    expect(errors).toEqual([
      'test/unit/fixtures/lint/table.feature:4: error: No value named "nobody" for {nobody}. Known values: {env.NAME}, {unique}, {today} and the other dates. Add data/nobody.json, or remember a value as "nobody" first. For literal braces, write \\{nobody}. (unknown-value)',
    ]);
  });

  it('summarizes the counts', () => {
    expect(summarize(messages)).toBe('5 errors, 1 warning, 2 info');
  });

  it('checks only element names for selectors and only opened addresses for URLs', () => {
    const errors = lintFeatures([path.join(__dirname, 'fixtures/lint/data.feature')], root).filter(
      (message) => message.severity === 'error',
    );
    expect(errors).toEqual([]);
  });

  it('reports syntax errors with the line', () => {
    const [message] = lintFeatures([path.join(__dirname, 'fixtures/lint/syntax.feature')], root);
    expect(message).toMatchObject({
      file: 'test/unit/fixtures/lint/syntax.feature',
      line: 5,
      severity: 'error',
      rule: 'syntax',
    });
    expect(message.message).toBe(
      '"This line is not valid Gherkin" is not a step: steps start with * (or Given, When, Then). Other text goes right below the "Feature:" or "Scenario:" line, or after # as a comment.',
    );
  });
});

/** Fresh registries, for checks that would change the results of the other tests. */
async function fresh() {
  vi.resetModules();
  const library = await import('../../src/index');
  const lint = await import('../../src/lint');
  const registry = await import('../../src/registry');
  const check = (feature: string, cwd = root) =>
    lint
      .lintFeatures([path.join(__dirname, 'fixtures/lint', feature)], cwd)
      .filter((message) => message.severity !== 'info')
      .map(lint.formatLintMessage);
  const project = (pattern: string, example: string, file: string) =>
    registry.registerStep(
      { pattern, description: 'Test step.', example, fn: () => {} },
      { source: 'project', location: { file: path.join(root, file), line: 3, column: 1 } },
    );
  return { library, check, project, registry };
}

describe('lint, with steps and keywords of its own', () => {
  it('reports a keyword worded like another step once, at the keyword', async () => {
    const { library, check } = await fresh();
    library.defineKeywords('keywords/*.feature', {
      cwd: path.join(__dirname, 'fixtures/lint/collision'),
    });
    expect(check('collision/orders.feature')).toEqual([
      'test/unit/fixtures/lint/collision/keywords/buttons.feature:3: error: The keyword "I click the "<name>" button" has the same wording as the step "I click the {element}". Steps worded like it match both: reword the keyword. (keyword)',
    ]);
  });

  it('reports a step whose wording matches the example of a built-in step at that step', async () => {
    const { check, project } = await fresh();
    project('I reload/refresh the page', 'I refresh the page', 'steps/pages.ts');
    expect(check('pages.feature').filter((line) => line.includes('step-example'))).toEqual([
      'steps/pages.ts:3: error: "I reload/refresh the page" also matches "I reload the page", the example of the built-in step "I reload the page". Word it differently. (step-example)',
    ]);
  });

  it('knows the name a project step remembers', async () => {
    const { check, registry } = await fresh();
    const step = {
      pattern: 'I take the number from {string} as {string}',
      description: 'Test step.',
      example: 'I take the number from "Order 1" as "order"',
      fn: () => {},
    };
    registry.registerStep(step, { source: 'project' });
    expect(check('project-remember.feature')).toEqual([
      'test/unit/fixtures/lint/project-remember.feature:5: error: No value named "order" for {order}. Known values: {env.NAME}, {unique}, {today} and the other dates. Add data/order.json, or remember a value as "order" first. For literal braces, write \\{order}. (unknown-value)',
    ]);
    const again = await fresh();
    again.registry.registerStep(
      { ...step, remembers: (args) => String(args[1]) },
      { source: 'project' },
    );
    expect(again.check('project-remember.feature')).toEqual([]);
  });

  it('reports pages that cannot be opened, and environment variables not set', async () => {
    const { library, check } = await fresh();
    library.definePage('Order', { url: '/orders/*' });
    library.definePage('Draft');
    expect(check('pages.feature')).toEqual([
      'test/unit/fixtures/lint/pages.feature:4: error: The page "Order" has the address pattern /orders/*, which cannot be opened. Open the address with I open the url "/...", then I am on the "Order" page. (page-address)',
      'test/unit/fixtures/lint/pages.feature:7: warning: The environment variable PLAINWRIGHT_LINT_UNSET is not set. Set it, or add it to the .env file, before the tests run. (unknown-value)',
    ]);
  });

  it('does not send pages to a pages/ folder that belongs to the app', async () => {
    const { check } = await fresh();
    expect(
      check('next/features/start.feature', path.join(__dirname, 'fixtures/lint/next')),
    ).toEqual([
      `features/start.feature:4: error: No page named "Start". pages/ holds your app's files (pages/index.js), so Plainwright loads no pages from it. Open the address with I open the url "/...". (unknown-page)`,
    ]);
  });
});

describe('docs', () => {
  it('renders core steps before advanced steps, by category', () => {
    const markdown = renderStepReference(getSteps().filter((s) => s.source === 'built-in'));
    expect(markdown.indexOf('### Core steps')).toBeLessThan(markdown.indexOf('### Advanced steps'));
    expect(markdown).toContain(
      '| `I click the "Log in" button` | Clicks the element once with the left mouse button. |',
    );
    expect(markdown.indexOf('#### Pages and navigation')).toBeLessThan(
      markdown.indexOf('#### Clicking and typing'),
    );
  });

  it('renders the element types', () => {
    expect(renderElementTypes()).toContain('| `the "…" button` |');
  });

  it('replaces generated sections between markers', () => {
    const document = 'a\n<!-- generated:x -->\nold\n<!-- /generated:x -->\nb';
    expect(replaceGenerated(document, 'x', 'new')).toBe(
      'a\n<!-- generated:x -->\n\nnew\n\n<!-- /generated:x -->\nb',
    );
    expect(() => replaceGenerated('a', 'x', 'new')).toThrow(/Markers for "x" not found/);
  });
});
