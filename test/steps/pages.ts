import { definePage } from '../../src/index';

// Pages of the test app (test/test-app), served at baseURL by test/server.mjs.
// Feature files refer to them by name: I open the "Login" page.

definePage('Login', { url: '/login.html' });
definePage('Dashboard', { url: '/dashboard.html' });
definePage('Forms', { url: '/forms.html' });
definePage('Interactions', { url: '/interactions.html' });
definePage('Assertions', { url: '/assertions.html' });
definePage('Download', { url: '/download.html' });
definePage('Drag and drop', { url: '/drag.html' });
definePage('File upload', { url: '/filechooser.html' });
definePage('Mouse', { url: '/mouse.html' });
definePage('Touch', { url: '/touch.html' });
definePage('Swatch', { url: '/swatch.html' });
definePage('Widgets', { url: '/widgets.html' });
definePage('Account settings', { url: '/account/settings.html' });
definePage('Cookies', { url: '/cookies.html' });
// Asks "Leave site?" once the notes have unsaved changes.
definePage('Editor', { url: '/editor.html' });

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
