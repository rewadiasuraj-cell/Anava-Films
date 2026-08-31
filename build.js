const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// Remove existing dist directory if present
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

fs.mkdirSync(distDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Files and directories to include in dist output
const filesToCopy = [
  'index.html',
  'about.html',
  'what-we-do.html',
  'work.html',
  'process.html',
  'testimonials.html',
  'contact.html',
  '.htaccess',
  'robots.txt',
  'sitemap.xml',
  'vercel.json',
  'assets'
];

filesToCopy.forEach((item) => {
  const srcPath = path.join(__dirname, item);
  const destPath = path.join(distDir, item);
  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
    console.log(`Copied ${item} -> dist/${item}`);
  }
});

console.log('Build output successfully created in dist/');
