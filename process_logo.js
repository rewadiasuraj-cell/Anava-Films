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

    // Find the split x coordinate between ANAVA and FILMS
    // ANAVA is the first 5 letters (A N A V A), FILMS is the next 5 letters (F I L M S)
    // In "ANAVAFILMS", ANAVA takes approx 52% of the total width
    const splitX = Math.floor(width * 0.528);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;

        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];

        // Calculate luminance / intensity
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114);

        if (luminance < 35) {
          // Transparent background
          this.data[idx] = 0;
          this.data[idx + 1] = 0;
          this.data[idx + 2] = 0;
          this.data[idx + 3] = 0;
        } else {
          // Normalize alpha for smooth antialiasing
          const alpha = Math.min(255, Math.floor((luminance - 20) * 1.6));

          if (x < splitX) {
            // ANAVA -> Crisp Solid White
            this.data[idx] = 255;
            this.data[idx + 1] = 255;
            this.data[idx + 2] = 255;
            this.data[idx + 3] = alpha;
          } else {
            // FILMS -> Solid Luxury Gold / Yellow (#D4AF37 / #E6B800)
            this.data[idx] = 212;     // R: 212
            this.data[idx + 1] = 175; // G: 175
            this.data[idx + 2] = 55;  // B: 55
            this.data[idx + 3] = alpha;
          }
        }
      }
    }

    this.pack().pipe(fs.createWriteStream(outputPath)).on('finish', () => {
      console.log('Processed official transparent logo saved to:', outputPath);
    });
  });
