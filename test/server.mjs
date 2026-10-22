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

// A small API for the test data steps: /api/orders and /api/orders/<id>, kept in memory.
const orders = new Map();
let nextId = 1001;

async function api(request, response, pathname) {
  const id = pathname.split('/')[3];
  const send = (status, body) =>
    response
      .writeHead(status, { 'content-type': 'application/json' })
      .end(body === undefined ? '' : JSON.stringify(body));
  let body = '';
  for await (const chunk of request) body += chunk;
  const data = body ? JSON.parse(body) : {};
  if (!id && request.method === 'GET') return send(200, [...orders.values()]);
  if (!id && request.method === 'POST') {
    const order = { id: String(nextId++), status: 'new', ...data };
    orders.set(order.id, order);
    return send(201, order);
  }
  const order = orders.get(id);
  if (!order) return send(404, { error: `No order ${id}` });
  if (request.method === 'GET') return send(200, order);
  if (request.method === 'PATCH') return send(200, Object.assign(order, data));
  if (request.method === 'DELETE') {
    orders.delete(id);
    return send(204);
  }
  return send(405, { error: 'Method not allowed' });
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  if (pathname.startsWith('/api/orders')) {
    api(request, response, pathname).catch((error) =>
      response.writeHead(400, { 'content-type': 'text/plain' }).end(String(error)),
    );
    return;
  }
  // An order's page has its number in the address, as in many apps: /orders/1001.
  const page = /^\/orders\/\d+$/.test(pathname) ? '/order.html' : pathname;
  const file = path.join(root, path.normalize(decodeURIComponent(page)).replace(/^([/\\])+/, ''));
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
