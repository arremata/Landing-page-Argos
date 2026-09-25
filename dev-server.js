// Servidor local só para desenvolvimento — serve os arquivos estáticos e
// roteia POST /api/waitlist para api/waitlist.js, simulando o ambiente da
// Vercel sem precisar instalar a CLI. Não usar em produção.

const http = require('http');
const fs = require('fs');
const path = require('path');

const waitlistHandler = require('./api/waitlist');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  if (urlPath.endsWith('/')) urlPath += 'index.html';

  let filePath = path.join(ROOT, decodeURIComponent(urlPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!path.extname(filePath)) {
    const withHtml = filePath + '.html';
    const asDir = path.join(filePath, 'index.html');
    if (fs.existsSync(asDir)) filePath = asDir;
    else if (fs.existsSync(withHtml)) filePath = withHtml;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function withVercelStyleRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };
  return res;
}

// Espelha os "redirects" do vercel.json: a LP de morar virou a raiz.
const REDIRECTS = { '/morar': '/', '/morar/': '/' };

const server = http.createServer((req, res) => {
  const redirectTo = REDIRECTS[req.url.split('?')[0]];
  if (redirectTo) {
    res.writeHead(308, { Location: redirectTo });
    res.end();
    return;
  }

  if (req.url === '/api/waitlist' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      waitlistHandler(req, withVercelStyleRes(res));
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Argos landing rodando em http://localhost:${PORT}`);
});
