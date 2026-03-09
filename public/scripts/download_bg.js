const https = require('https');
const fs = require('fs');

const url = 'https://cdn.pixabay.com/video/2021/08/04/83818-584742767_large.mp4'\;
const file = fs.createWriteStream('raw_bg.mp4');

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}, function(response) {
  if (response.statusCode !== 200) {
    console.error(`Failed to get '${url}' (${response.statusCode})`);
    process.exit(1);
  }
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download completed.');
  });
}).on('error', function(err) {
  fs.unlink('raw_bg.mp4');
  console.error('Error downloading:', err.message);
  process.exit(1);
});
