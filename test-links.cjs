const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      https.get(url, (res) => {
        resolve({url, status: res.statusCode});
      }).on('error', (e) => {
        resolve({url, status: 'error'});
      });
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
  'https://static.wikia.nocookie.net/naruto/images/2/21/Sasuke_Part_1.png'
];

Promise.all(urls.map(checkUrl)).then(console.log);
