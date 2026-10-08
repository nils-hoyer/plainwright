// Serves test/test-app over HTTP for the Playwright tests (see webServer in playwright.config.ts).
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'test-app');
const port = Number(process.env.PORT ?? 3123);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = path.join(root, path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, ''));
  const target = pathname.endsWith('/') ? path.join(file, 'index.html') : file;
  if (!target.startsWith(root) || !isFile(target)) {
    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': types[path.extname(target)] ?? 'application/octet-stream',
  });
  createReadStream(target).pipe(response);
}).listen(port, () => console.log(`Test app on http://localhost:${port}`));

function isFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}
