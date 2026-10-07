// Local preview: `npm run dev`, then open http://localhost:4321
// Mirrors Vercel's cleanUrls (/memos -> /memos.html). The signup API only runs on Vercel.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const DIST = path.join(path.dirname(new URL(import.meta.url).pathname), 'dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith('/api/')) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end('{"error":"The signup API only runs on Vercel."}'); }
  const candidates = [p, `${p}.html`, path.join(p, 'index.html')];
  for (const c of candidates) {
    const f = path.join(DIST, c);
    if (f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
      return fs.createReadStream(f).pipe(res);
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/html' });
  fs.createReadStream(path.join(DIST, '404.html')).pipe(res);
}).listen(4321, () => console.log('http://localhost:4321'));
