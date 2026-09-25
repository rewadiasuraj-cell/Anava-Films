const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Regenerate HTML from the source generator and portfolio data before
// packaging. Fail early rather than deploy stale generated pages.
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const generate = spawnSync(python, ['build_anava.py'], {
  cwd: __dirname,
  stdio: 'inherit'
});
if (generate.error) {
  console.error('Could not run page generator:', generate.error.message);
  process.exit(1);
}
if (generate.status !== 0) {
  console.error('Page generation failed; dist was not modified.');
  process.exit(generate.status || 1);
}


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
  'work.html',
  'process.html',
  'testimonials.html',
  'contact.html',
  '404.html',
  '.htaccess',
  'robots.txt',
  'sitemap.xml',
  'vercel.json',
  'favicon.png',
  'intro',
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
