const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const req = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'HEAD'
      }, (res) => {
        resolve({url, status: res.statusCode});
      });
      req.on('error', (e) => resolve({url, status: 'error'}));
      req.end();
    } catch {
      resolve({url, status: 'error'});
    }
  });
}

const urls = [
  'https://static.wikia.nocookie.net/chainsaw-man/images/d/d4/Aki_Hayakawa_anime_design.png',
  'https://static.wikia.nocookie.net/eldenring/images/9/90/Tarnished.png',
  'https://static.wikia.nocookie.net/eldenring/images/e/ef/White_Mask_Varre.png',
  'https://static.wikia.nocookie.net/jujutsu-kaisen/images/4/4e/Kirara_Hoshi_profile.png',
  'https://static.wikia.nocookie.net/jujutsu-kaisen/images/c/c5/Kinji_Hakari_profile.png',
  'https://static.wikia.nocookie.net/naruto/images/2/21/Sasuke_Part_1.png',
  'https://ui-avatars.com/api/?name=Aki+Hayakawa',
  'https://ui-avatars.com/api/?name=The+Tarnished',
  'https://ui-avatars.com/api/?name=White+Mask+Varre',
  'https://ui-avatars.com/api/?name=Kirara',
  'https://ui-avatars.com/api/?name=Hakari',
  'https://ui-avatars.com/api/?name=Sasuke'
];

Promise.all(urls.map(checkUrl)).then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(0); });
