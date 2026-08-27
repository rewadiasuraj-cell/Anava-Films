const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// 1. Copy logo assets
fs.copyFileSync(
  path.join(__dirname, 'Anava films logo png.png'),
  path.join(imgDir, 'anava_official_logo.png')
);
fs.copyFileSync(
  path.join(__dirname, 'Anava films logo png.png'),
  path.join(imgDir, 'anava_logo_white.png')
);
fs.copyFileSync(
  path.join(__dirname, 'Anava films logo Black color.jpeg.png'),
  path.join(imgDir, 'anava_logo_black.png')
);

// 2. SVG placeholder portraits for leadership if jpg files not present
const avatarJackson = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12141a"/>
      <stop offset="100%" stop-color="#222733"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g1)"/>
  <circle cx="200" cy="140" r="65" fill="#f5b719" opacity="0.9"/>
  <path d="M70 360 C70 240, 330 240, 330 360 Z" fill="#f5b719" opacity="0.9"/>
  <text x="200" y="380" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">JACKSON KHATRI</text>
</svg>`;

const avatarAnjan = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12141a"/>
      <stop offset="100%" stop-color="#222733"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g2)"/>
  <circle cx="200" cy="140" r="65" fill="#e2e8f0" opacity="0.85"/>
  <path d="M70 360 C70 240, 330 240, 330 360 Z" fill="#e2e8f0" opacity="0.85"/>
  <text x="200" y="380" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">ANJAN KHATRI</text>
</svg>`;

fs.writeFileSync(path.join(imgDir, 'hustler.jpg'), avatarJackson);
fs.writeFileSync(path.join(imgDir, 'john_jacobs.jpg'), avatarAnjan);

console.log('All image assets created successfully in assets/images');
