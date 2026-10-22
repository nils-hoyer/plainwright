import { expect } from '@playwright/test';
import { describeMissingText, type ElementRef } from '../elements';
import { addHint, type World } from '../world';
import { category, escapeRegExp } from './builtin';

const step = category('Checking what you see');

// All checks wait until they pass or the expect timeout (5 seconds by default) runs out.

step({
  pattern: 'I see the {element}',
  level: 'core',
  description: 'Checks that the element is visible.',
  example: 'I see the "Welcome to your Dashboard" heading',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeVisible());
  },
});

step({
  pattern: 'I do not see the {element}',
  level: 'core',
  description: 'Checks that the element is hidden or not on the page.',
  example: 'I do not see the "Close" button',
  fn: async ({ world }, element: ElementRef) => {
    await expect(world.element(element)).toBeHidden();
  },
});

step({
  pattern: 'I see the text {string}',
  level: 'core',
  description:
    'Checks that some visible element on the page contains this text, with the same capitals.',
  example: 'I see the text "Welcome back!"',
  fn: async ({ world }, text: string) => {
    try {
      await expect(containingText(world, text).first()).toBeVisible();
    } catch (error) {
      if (error instanceof Error) {
        const snapshot = await world.scope
          .locator('body')
          .ariaSnapshot({ timeout: 2000 })
          .catch(() => '');
        addHint(error, describeMissingText(text, snapshot, world.address()));
      }
      throw error;
    }
  },
});

step({
  pattern: 'I do not see the text {string}',
  level: 'core',
  description:
    'Checks that no visible element on the page contains this text, with the same capitals.',
  example: 'I do not see the text "Username and password are incorrect."',
  fn: async ({ world }, text: string) => {
    await expect(containingText(world, text)).toHaveCount(0);
  },
});

step({
  pattern: 'I see the text {string} in the {element}',
  level: 'core',
  description: 'Checks that the element contains this text, with the same capitals.',
  example: 'I see the text "Savings" in the "Account Overview" section',
  fn: async ({ world }, text: string, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toContainText(text));
  },
});

step({
  pattern: 'I do not see the text {string} in the {element}',
  level: 'core',
  description: 'Checks that the element does not contain this text, with the same capitals.',
  example: 'I do not see the text "Loans" in the "Account Overview" section',
  fn: async ({ world }, text: string, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).not.toContainText(text));
  },
});

step({
  pattern: 'I see exactly the text {string} in the {element}',
  level: 'advanced',
  description: 'Checks that the whole text of the element is exactly this text.',
  example: 'I see exactly the text "Hello World" in the "Greeting" element',
  fn: async ({ world }, text: string, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toHaveText(text));
  },
});

step({
  pattern: 'I see the value {string} in the {element}',
  level: 'core',
  description: 'Checks that the field contains exactly this value.',
  example: 'I see the value "Jane Doe" in the "Full Name" field',
  fn: async ({ world }, value: string, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toHaveValue(value));
  },
});

step({
  pattern: 'I see {string} selected in the {element}',
  level: 'core',
  description: 'Checks that the option with this visible text is selected in the dropdown.',
  example: 'I see "Germany" selected in the "Country" dropdown',
  fn: async ({ world }, option: string, element: ElementRef) => {
    await world.withElement(element, (el) =>
      expect
        .poll(
          () =>
            el.evaluate(
              (node) =>
                Array.from((node as HTMLSelectElement).selectedOptions ?? [], (o) =>
                  o.label.trim(),
                ),
              undefined,
              { timeout: 1000 },
            ),
          { message: `Expected "${option}" to be selected in the ${element}` },
        )
        .toContain(option),
    );
  },
});

step({
  pattern: 'I see the {element} is empty',
  level: 'core',
  description: 'Checks that the field has no value, or that the element has no text.',
  example: 'I see the "Full Name" field is empty',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeEmpty());
  },
});

step({
  pattern: 'I see the {element} is enabled',
  level: 'core',
  description: 'Checks that the element can be used (it is not disabled).',
  example: 'I see the "Log in" button is enabled',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeEnabled());
  },
});

step({
  pattern: 'I see the {element} is disabled',
  level: 'core',
  description: 'Checks that the element is disabled and cannot be used.',
  example: 'I see the "Log in" button is disabled',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeDisabled());
  },
});

step({
  pattern: 'I see the {element} is checked',
  level: 'core',
  description:
    'Checks that the checkbox is ticked, the switch is on or the radio button is selected.',
  example: 'I see the "I accept the terms and conditions" checkbox is checked',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeChecked());
  },
});

step({
  pattern: 'I see the {element} is not checked',
  level: 'core',
  description:
    'Checks that the checkbox is not ticked, the switch is off or the radio button is not selected.',
  example: 'I see the "Subscribe to newsletter" checkbox is not checked',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).not.toBeChecked());
  },
});

step({
  pattern: 'I see {number} item(s) in the {element}',
  level: 'core',
  description: 'Checks how many visible items the list has.',
  example: 'I see "3" items in the "Accounts" list',
  fn: async ({ world }, count: number, element: ElementRef) => {
    await world.withElement(element, (el) =>
      expect(el.getByRole('listitem').filter({ visible: true })).toHaveCount(count),
    );
  },
});

step({
  pattern: 'I see the {element} is focused',
  level: 'advanced',
  description: 'Checks that the element has the keyboard focus.',
  example: 'I see the "Full Name" field is focused',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeFocused());
  },
});

step({
  pattern: 'I see the {element} is editable',
  level: 'advanced',
  description: 'Checks that the field accepts input (it is neither disabled nor read-only).',
  example: 'I see the "Full Name" field is editable',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeEditable());
  },
});

step({
  pattern: 'I see the {element} is read-only',
  level: 'advanced',
  description: 'Checks that the field shows a value but does not accept input.',
  example: 'I see the "Read-only Field" field is read-only',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).not.toBeEditable());
  },
});

step({
  pattern: 'I see the {element} is in the viewport',
  level: 'advanced',
  description: 'Checks that the element is inside the visible part of the page, without scrolling.',
  example: 'I see the "Top of the page" element is in the viewport',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).toBeInViewport());
  },
});

step({
  pattern: 'I see the {element} is not in the viewport',
  level: 'advanced',
  description: 'Checks that the element is outside the visible part of the page.',
  example: 'I see the "Bottom of the page" element is not in the viewport',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => expect(el).not.toBeInViewport());
  },
});

step({
  pattern: 'I see the {element} with the description {string}',
  level: 'advanced',
  description: 'Checks the description screen readers announce for the element (aria-describedby).',
  example: 'I see the "Name" field with the description "This is a hint for the input below."',
  fn: async ({ world }, element: ElementRef, description: string) => {
    await world.withElement(element, (el) => expect(el).toHaveAccessibleDescription(description));
  },
});

step({
  pattern: 'I see the {element} with the error message {string}',
  level: 'advanced',
  description:
    'Checks the error message screen readers announce for the element (aria-errormessage).',
  example: 'I see the "Required field" field with the error message "This field is required."',
  fn: async ({ world }, element: ElementRef, message: string) => {
    await world.withElement(element, (el) => expect(el).toHaveAccessibleErrorMessage(message));
  },
});

step({
  pattern: 'I see the {element} leads to {string}',
  level: 'advanced',
  description: 'Checks the address the link leads to, absolute or relative to the base URL.',
  example: 'I see the "Help" link leads to "/help"',
  fn: async ({ world }, element: ElementRef, address: string) => {
    await world.withElement(element, async (el) => {
      // The href as the browser resolves it, like a click would follow it.
      const href = () =>
        el.evaluate(
          (node) => {
            const raw = node.getAttribute('href');
            if (raw === null) return null;
            try {
              return new URL(raw, node.baseURI).href;
            } catch {
              return raw;
            }
          },
          undefined,
          { timeout: 1000 },
        );
      try {
        await expect
          .poll(href, { message: `Expected the ${element} to lead to "${address}"` })
          .toBe(absoluteUrl(world.url(address)));
      } catch (error) {
        if ((await href().catch(() => undefined)) !== null) throw error;
        throw new Error(`[plainwright] The ${element} leads nowhere: it has no href.`);
      }
    });
  },
});

step({
  pattern: 'I see the {element} is expanded',
  level: 'advanced',
  description:
    'Checks that the element shows what it opens, such as a menu or a section of an accordion (aria-expanded, or an open details element).',
  example: 'I see the "Shipping" button is expanded',
  fn: async ({ world }, element: ElementRef) => {
    await checkExpanded(world, element, true);
  },
});

step({
  pattern: 'I see the {element} is collapsed',
  level: 'advanced',
  description:
    'Checks that the element hides what it opens, such as a closed menu or a closed section of an accordion.',
  example: 'I see the "Shipping" button is collapsed',
  fn: async ({ world }, element: ElementRef) => {
    await checkExpanded(world, element, false);
  },
});

/** The URL as the browser writes it (`https://example.com/`), or the text when it is not one. */
function absoluteUrl(url: string): string {
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

/**
 * Whether the element is expanded: an element with `aria-expanded`, or a `<details>` element,
 * also named by its `<summary>` or by a heading in it. It reads `aria-expanded` on any element,
 * also one whose role does not support it, where the accessibility tree would leave it out.
 */
async function checkExpanded(world: World, element: ElementRef, expanded: boolean) {
  await world.withElement(element, async (el) => {
    const state = () =>
      el.evaluate(
        (node) => {
          const details =
            node instanceof HTMLDetailsElement ? node : node.closest('summary')?.parentElement;
          if (details instanceof HTMLDetailsElement) return details.open;
          const attribute = node.getAttribute('aria-expanded');
          return attribute === null ? null : attribute === 'true';
        },
        undefined,
        { timeout: 1000 },
      );
    try {
      await expect
        .poll(state, {
          message: `Expected the ${element} to be ${expanded ? 'expanded' : 'collapsed'}`,
        })
        .toBe(expanded);
    } catch (error) {
      if ((await state().catch(() => undefined)) !== null) throw error;
      throw new Error(
        `[plainwright] The ${element} does not open or close anything: it has no aria-expanded and is no details element.`,
      );
    }
  });
}

/**
 * Visible elements that contain the text with the same capitals, like `toContainText`.
 * A plain string in `getByText` would also ignore capitals.
 */
function containingText(world: World, text: string) {
  return world.scope.getByText(new RegExp(escapeRegExp(text))).filter({ visible: true });
}
