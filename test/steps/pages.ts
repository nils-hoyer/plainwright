import { definePage, definePages } from '../../src/index';

// Pages of the test app (test/test-app), served at baseURL by test/server.mjs.
// Feature files refer to them by name: I open the "Login" page. Most are in test/pages.json,
// the way a project writes them in pages.json; this file shows definePage() in TypeScript.
definePages('test/pages.json');

// A page whose elements have no usable visible names. Aliases give them one.
definePage('Orders', {
  url: '/orders.html',
  elements: {
    // A text field without label or placeholder.
    Search: '[data-testid="input-search"]',
    // An icon-only button. The key includes the type, so the "Settings" dialog is still
    // found by its title.
    '"Settings" button': '[data-testid="btn-settings"]',
    // Both rows have a "Delete" button. No alias needed: the "Delete" button in the "Order 1001" row.
  },
});
