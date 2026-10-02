const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }

  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(target, (statError, stat) => {
    const file = !statError && stat.isDirectory() ? path.join(target, 'index.html') : target;
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404, {'Cache-Control':'no-store'}); res.end('Not found'); return; }
      res.writeHead(200, {
        'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  });
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Smile & Shine QA server listening on http://127.0.0.1:${port}\n`);
});
