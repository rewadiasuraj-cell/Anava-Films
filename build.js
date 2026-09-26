const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Generate pages when Python is available (local development / GitHub Actions).
// Hostinger's Node.js builder does not provide python3, so it packages the
// checked-in generated HTML and refreshes its CSS/JS cache-busting hashes.
// Any edits to build_anava.py or work.json must still be generated and
// committed before deployment; the CI build below uses Python to verify them.
let usedCheckedInPages = false;
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const generate = spawnSync(python, ['build_anava.py'], {
  cwd: __dirname,
  stdio: 'inherit'
});
if (generate.error && generate.error.code === 'ENOENT') {
  usedCheckedInPages = true;
  console.warn(`Python is unavailable (${python}); packaging checked-in generated HTML.`);
} else if (generate.error || generate.status !== 0) {
  console.error('Page generation failed:', generate.error?.message || generate.status);
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


// Keep asset cache-busting versions aligned even when Python is unavailable.
// The checked-in page markup is already generated; only asset URL hashes
// need to be updated when CSS/JS changes between deployments.
const crypto = require('crypto');
const versionedAssets = [
  'assets/css/anava.css',
  'assets/js/anava.js',
  'assets/js/anava-motion.js'
];
const versions = versionedAssets.map(file => ({
  file,
  hash: crypto.createHash('sha1')
    .update(fs.readFileSync(path.join(__dirname, file)))
    .digest('hex').slice(0, 10)
}));
for (const page of ['index.html', 'work.html', 'process.html', 'about.html', 'contact.html', '404.html']) {
  const destination = path.join(distDir, page);
  if (!fs.existsSync(destination)) {
    console.error('Missing generated page:', page);
    process.exit(1);
  }
  let html = fs.readFileSync(destination, 'utf8');
  for (const { file, hash } of versions) {
    // Version values are SHA-1 hex from build_anava.py (10 characters).
    html = html.replaceAll(new RegExp(file.replaceAll('.', '\\.') + '\\?v=[0-9a-f]{10}', 'g'), file + '?v=' + hash);
  }
  fs.writeFileSync(destination, html);
}
if (usedCheckedInPages) console.warn('Regenerate and commit HTML whenever the Python generator or work.json changes.');
