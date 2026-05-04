const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({url, status: res.statusCode});
    }).on('error', () => resolve({url, status: 'error'}));
  });
}

const urls = [
  'https://cdn.myanimelist.net/images/characters/13/395003.jpg',
  'https://cdn.myanimelist.net/images/characters/11/628590.jpg',
  'https://cdn.myanimelist.net/images/characters/8/621869.jpg',
  'https://cdn.myanimelist.net/images/characters/9/131317.jpg',
];

Promise.all(urls.map(checkUrl)).then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(0); });
