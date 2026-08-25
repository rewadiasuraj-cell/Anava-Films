const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

const inputPath = path.join(__dirname, 'assets', 'images', 'anava_logo_white.png');
const outputPath = path.join(__dirname, 'assets', 'images', 'anava_official_logo.png');

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;

    let minX = width, minY = height, maxX = 0, maxY = 0;

    // First pass: locate bounding box of non-dark pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114);

        if (luminance >= 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    const output = new PNG({ width: cropWidth, height: cropHeight });

    for (let y = 0; y < cropHeight; y++) {
      for (let x = 0; x < cropWidth; x++) {
        const origX = minX + x;
        const origY = minY + y;
        const origIdx = (width * origY + origX) << 2;
        const outIdx = (cropWidth * y + x) << 2;

        const r = this.data[origIdx];
        const g = this.data[origIdx + 1];
        const b = this.data[origIdx + 2];
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114);

        if (luminance < 30) {
          output.data[outIdx] = 0;
          output.data[outIdx + 1] = 0;
          output.data[outIdx + 2] = 0;
          output.data[outIdx + 3] = 0;
        } else {
          const alpha = Math.min(255, Math.floor((luminance - 20) * 1.6));
          // Pure Crisp Solid White for ALL letters (ANAVA FILMS)
          output.data[outIdx] = 255;
          output.data[outIdx + 1] = 255;
          output.data[outIdx + 2] = 255;
          output.data[outIdx + 3] = alpha;
        }
      }
    }

    output.pack().pipe(fs.createWriteStream(outputPath)).on('finish', () => {
      console.log(`Pure White Transparent Official Logo saved! Dimensions: ${cropWidth}x${cropHeight}`);
    });
  });
