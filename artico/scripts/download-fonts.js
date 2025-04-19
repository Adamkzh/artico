const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    name: 'Inter-Regular.ttf',
    url: 'https://rsms.me/inter/font-files/Inter-Regular.woff2'
  },
  {
    name: 'Inter-Bold.ttf',
    url: 'https://rsms.me/inter/font-files/Inter-Bold.woff2'
  }
];

const fontsDir = path.join(__dirname, '../assets/fonts');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

fonts.forEach(font => {
  const filePath = path.join(fontsDir, font.name);
  const file = fs.createWriteStream(filePath);
  
  https.get(font.url, response => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${font.name}`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${font.name}:`, err.message);
  });
}); 