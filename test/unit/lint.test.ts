import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderElementTypes, renderStepReference, replaceGenerated } from '../../src/docs';
import { getSteps } from '../../src/index';
import { formatLintMessage, lintFeatures, summarize } from '../../src/lint';

const root = path.join(__dirname, '../..');

describe('lint', () => {
  const messages = lintFeatures([path.join(__dirname, 'fixtures/lint/problems.feature')], root);
  const file = 'test/unit/fixtures/lint/problems.feature';

  it('reports problems as file:line: severity: message', () => {
    expect(messages.map(formatLintMessage)).toEqual([
      `${file}:4: error: "https://example.com/login" is an absolute URL. Use a page name (I open the "..." page) or a URL relative to baseURL. (absolute-url)`,
      `${file}:4: info: "I open the url {string}" is an advanced step. (advanced-step)`,
      `${file}:5: error: "#submit" looks like a selector. Name the element by what the user sees, or add an alias with definePage(). (selector)`,
      `${file}:6: error: Unknown step "I clik the "Log in" button". Did you mean "I click the "Log in" button"? (undefined-step)`,
      `${file}:7: error: "[data-testid='username']" looks like a selector. Name the element by what the user sees, or add an alias with definePage(). (selector)`,
      `${file}:8: warning: Fixed waits slow tests down and still break on slow days. Check for what the user waits for instead, e.g. I see the text "...". (discouraged-step)`,
      `${file}:8: info: "I wait {number} second(s)" is an advanced step. (advanced-step)`,
      `${file}:9: info: "I focus on the {element}" is an advanced step. (advanced-step)`,
    ]);
  });

  it('summarizes the counts', () => {
    expect(summarize(messages)).toBe('4 errors, 1 warning, 3 info');
  });

  it('reports syntax errors with the line', () => {
    const [message] = lintFeatures([path.join(__dirname, 'fixtures/lint/syntax.feature')], root);
    expect(message).toMatchObject({
      file: 'test/unit/fixtures/lint/syntax.feature',
      line: 5,
      severity: 'error',
      rule: 'syntax',
    });
    expect(message.message).toMatch(/^expected: /);
  });
});

describe('docs', () => {
  it('renders core steps before advanced steps, by category', () => {
    const markdown = renderStepReference(getSteps().filter((s) => s.source === 'built-in'));
    expect(markdown.indexOf('### Core steps')).toBeLessThan(markdown.indexOf('### Advanced steps'));
    expect(markdown).toContain(
      '| `I click the {element}` | Clicks the element once with the left mouse button. | `I click the "Log in" button` |',
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
