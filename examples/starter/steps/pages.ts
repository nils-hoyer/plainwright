import { definePage } from '@nils.hoyer/plainwright';

// Feature files open pages by name: I open the "Todos" page.
definePage('Todos', {
  url: '/',
  elements: {
    // The list of todos has no accessible name, so we give it one.
    'Todo items': '.todo-list',
  },
});
