import { expect } from '@playwright/test';
import type { ElementRef } from '../elements';
import type { ApiResponse, World } from '../world';
import { category } from './builtin';

const step = category('Test data and APIs');

// Values written {name} in later steps. Data files and {env.NAME} need no step.

step({
  pattern: 'I remember {string} as {string}',
  level: 'advanced',
  description:
    'Keeps the value under the name for the rest of the test; later steps write it as "{name}".',
  example: 'I remember "Coffee" as "item"',
  values: 'raw',
  remembers: (args) => String(args[1]),
  fn: ({ world }, value: unknown, name: unknown) => {
    world.remember(text(name), value);
  },
});

step({
  pattern: 'I remember the text of the {element} as {string}',
  level: 'advanced',
  description:
    'Keeps the text of the element, or the value of a field, under the name for the rest of the test.',
  example: 'I remember the text of the "Order number" field as "order-number"',
  remembers: (args) => String(args[1]),
  fn: async ({ world }, element: ElementRef, name: string) => {
    const value = await world.withElement(element, async (el) => {
      const isField = await el.evaluate(
        (node) =>
          node instanceof HTMLInputElement ||
          node instanceof HTMLTextAreaElement ||
          node instanceof HTMLSelectElement,
      );
      return isField ? el.inputValue() : el.innerText();
    });
    world.remember(name, value.trim());
  },
});

step({
  pattern: 'I remember the url as {string}',
  level: 'advanced',
  description:
    'Keeps the address the browser shows, without the base URL when it is on the same website.',
  example: 'I remember the url as "order-page"',
  remembers: (args) => String(args[0]),
  fn: ({ world }, name: string) => {
    world.remember(name, world.address());
  },
});

// Test data through the app's API. Requests use the browser's cookies and the base URL.

step({
  pattern: 'I create {string} at {string} with {string}',
  level: 'advanced',
  description:
    'Sends the value as JSON in a POST request to the address, checks that it succeeded and remembers the answer under the name.',
  example: 'I create "order" at "/api/orders" with "{new-order}"',
  values: 'raw',
  remembers: (args) => String(args[0]),
  fn: async ({ world }, name: unknown, url: unknown, body: unknown) => {
    const response = await world.request('POST', text(url), body);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`[plainwright] Creating "${text(name)}" failed. ${describe(response)}`);
    }
    world.remember(text(name), response.body);
  },
});

step({
  pattern: 'I delete {string} after the test',
  level: 'advanced',
  description:
    'Sends a DELETE request to the address after the test, also when it failed. An address that is already gone counts as deleted.',
  example: 'I delete "/api/orders/{order.id}" after the test',
  fn: ({ world }, url: string) => {
    world.afterTest(`I delete "${url}"`, async () => {
      const response = await world.page.request.delete(url);
      if (!response.ok() && response.status() !== 404) {
        throw new Error(
          `[plainwright] Deleting "${url}" after the test failed: ${response.status()} ${await response.text()}`,
        );
      }
    });
  },
});

step({
  pattern: 'I send a {string} request to {string}',
  level: 'advanced',
  description:
    'Sends a request (GET, POST, PUT, PATCH or DELETE) to the address and remembers the answer as "{response}".',
  example: 'I send a "GET" request to "/api/orders"',
  remembers: () => 'response',
  fn: async ({ world }, method: string, url: string) => {
    await world.request(checkMethod(method), url);
  },
});

step({
  pattern: 'I send a {string} request to {string} with {string}',
  level: 'advanced',
  description:
    'Sends a request with the value as JSON to the address and remembers the answer as "{response}".',
  example: 'I send a "PATCH" request to "/api/orders/{order.id}" with "{paid-order}"',
  values: 'raw',
  remembers: () => 'response',
  fn: async ({ world }, method: unknown, url: unknown, body: unknown) => {
    await world.request(checkMethod(text(method)), text(url), body);
  },
});

step({
  pattern: 'I see the response status {number}',
  level: 'advanced',
  description: 'Checks the status code of the answer to the last request, e.g. "200" or "404".',
  example: 'I see the response status "201"',
  fn: ({ world }, status: number) => {
    const response = lastResponse(world);
    expect(response.status, `Expected status ${status}. ${describe(response)}`).toBe(status);
  },
});

step({
  pattern: 'I see the response field {string} with the value {string}',
  level: 'advanced',
  description:
    'Checks a field in the answer to the last request; "items.0.name" is the name of the first item.',
  example: 'I see the response field "status" with the value "paid"',
  fn: ({ world }, field: string, value: string) => {
    const response = lastResponse(world);
    const actual = fieldOf(response.body, field);
    expect(
      typeof actual === 'string' ? actual : JSON.stringify(actual),
      `Expected the response field "${field}" to be "${value}"`,
    ).toBe(value);
  },
});

function text(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function checkMethod(method: string) {
  const upper = method.toUpperCase();
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(upper)) {
    throw new Error(
      `[plainwright] Unknown request "${method}". Use GET, POST, PUT, PATCH or DELETE.`,
    );
  }
  return upper;
}

function lastResponse(world: World): ApiResponse {
  if (!world.response) {
    throw new Error(
      '[plainwright] No request was sent yet. Use I send a "GET" request to "..." first.',
    );
  }
  return world.response;
}

function describe(response: ApiResponse) {
  const body = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
  const excerpt = body.length > 300 ? `${body.slice(0, 297)}...` : body;
  return `${response.method} ${response.url} answered ${response.status}${excerpt ? `: ${excerpt}` : '.'}`;
}

/** `items.0.name` in the answer. */
function fieldOf(body: unknown, field: string): unknown {
  let value = body;
  for (const key of field.split('.')) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) {
      const known = value && typeof value === 'object' ? Object.keys(value) : [];
      throw new Error(
        `[plainwright] The response has no field "${field}".` +
          (known.length ? ` At "${key}" it has: ${known.map((k) => `"${k}"`).join(', ')}.` : ''),
      );
    }
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
