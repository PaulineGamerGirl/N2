const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({url, status: res.statusCode});
    }).on('error', () => resolve({url, status: 'error'}));
  });
}

const urls = [
  'https://upload.wikimedia.org/wikipedia/en/thumb/9/94/Joel_in_The_Last_of_Us.png/250px-Joel_in_The_Last_of_Us.png',
  'https://upload.wikimedia.org/wikipedia/en/9/96/Ellie_in_The_Last_of_Us_Part_II.png',
  'https://upload.wikimedia.org/wikipedia/en/9/9e/Cloud_Strife.png',
  'https://upload.wikimedia.org/wikipedia/en/6/61/Tifa_Lockhart_art.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/Sephiroth.png/250px-Sephiroth.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/NoctisLucisCaelum.png/250px-NoctisLucisCaelum.png',
];

Promise.all(urls.map(checkUrl)).then(r => { console.log(JSON.stringify(r.filter(x => x.status === 200), null, 2)); process.exit(0); });
