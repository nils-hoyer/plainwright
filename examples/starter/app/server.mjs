// Serves the example app in this folder. playwright.config.ts starts it for the tests;
// run `npm run app` to open it yourself, e.g. for `npm run inspect`.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3210);
const types = { '.html': 'text/html; charset=utf-8' };

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const name = pathname === '/' ? 'index.html' : path.normalize(pathname).replace(/^[/\\]+/, '');
  const file = path.join(root, name);
  if (!file.startsWith(root) || path.extname(file) !== '.html' || !isFile(file)) {
    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': types['.html'] });
  createReadStream(file).pipe(response);
}).listen(port, () => console.log(`Example app on http://localhost:${port}`));

function isFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}
