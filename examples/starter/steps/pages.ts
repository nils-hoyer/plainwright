import { definePage } from 'playwright-keywords';

// Feature files open pages by name: I open the "Todos" page.
definePage('Todos', {
  url: '/todomvc/',
  elements: {
    // The list of todos has no accessible name, so we give it one.
    'Todo items': '.todo-list',
  },
});
