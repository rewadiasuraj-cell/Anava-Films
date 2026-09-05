const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let rawUrl = req.url.split('?')[0];
  let queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  let reqUrl = decodeURIComponent(rawUrl);

  // If user requests .html file directly, 301 redirect to clean URL without .html
  if (reqUrl.endsWith('.html') && reqUrl !== '/index.html') {
    const cleanPath = reqUrl.slice(0, -5);
    res.writeHead(301, { Location: cleanPath + queryString });
    return res.end();
  }

  if (reqUrl === '/' || reqUrl === '/index' || reqUrl === '/index.html') {
    reqUrl = '/index.html';
  } else if (!path.extname(reqUrl)) {
    reqUrl += '.html';
  }

  const filePath = path.join(__dirname, reqUrl);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Page Not Found</h1><p><a href="/">Return to Home</a></p>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`ANAVA FILMS local server running at http://localhost:${PORT}`);
});
