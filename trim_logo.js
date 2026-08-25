const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

const inputPath = path.join(__dirname, 'assets', 'images', 'anava_official_logo.png');

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function() {
    let minX = this.width, minY = this.height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;
        if (this.data[idx + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    const cropped = new PNG({ width: cropWidth, height: cropHeight });

    this.bitblt(cropped, minX, minY, cropWidth, cropHeight, 0, 0);

    cropped.pack().pipe(fs.createWriteStream(inputPath)).on('finish', () => {
      console.log(`Trimmed logo saved! New dimensions: ${cropWidth}x${cropHeight}`);
    });
  });
