import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { cwd } from 'node:process';

const PORT = 5173;
const ROOT = cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const base = decoded === '/' ? '/index.html' : decoded;
  const normalized = normalize(base).replace(/^(\.\.[/\\])+/, '');
  return join(ROOT, normalized);
}

createServer(async (req, res) => {
  const filePath = safePath(req.url);
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    const ext = extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not Found');
  }
}).listen(PORT, () => {
  console.log(`ClassBoard dev server running at http://localhost:${PORT}`);
});

