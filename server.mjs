import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

createServer(async (req, res) => {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const routePath = requested === '/manus-routes.json' ? '/public/manus-routes.json' : requested;
  const safePath = normalize(routePath).replace(/^([.][.][/\\])+/, '');
  const filePath = join(root, safePath === '/' ? 'index.html' : safePath);
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    if (!extname(safePath)) {
      const body = await readFile(join(root, 'index.html'));
      res.writeHead(200, { 'Content-Type': mime['.html'] });
      res.end(body);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Data Factory Tech Hub preview listening on http://0.0.0.0:${port}`);
});
