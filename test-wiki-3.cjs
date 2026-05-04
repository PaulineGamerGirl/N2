const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({url, status: res.statusCode});
    }).on('error', () => resolve({url, status: 'error'}));
  });
}

const urls = [
  'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Denji_Chainsaw_Man.png/250px-Denji_Chainsaw_Man.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/9/93/Final_Fantasy_XVI_Clive_Rosfield.png/250px-Final_Fantasy_XVI_Clive_Rosfield.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/6/6a/Cidolfus_Telamon.png/250px-Cidolfus_Telamon.png',
  'https://upload.wikimedia.org/wikipedia/en/2/22/Makima_Chainsaw_Man.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/2/22/Makima_Chainsaw_Man.png/250px-Makima_Chainsaw_Man.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Makima_Chainsaw_Man.png/220px-Makima_Chainsaw_Man.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Clive_Rosfield.png/220px-Clive_Rosfield.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Clive_Rosfield.png/250px-Clive_Rosfield.png',
  'https://upload.wikimedia.org/wikipedia/en/9/92/Clive_Rosfield.png',
  'https://upload.wikimedia.org/wikipedia/en/thumb/9/92/Clive_Rosfield.png/250px-Clive_Rosfield.png',
];

Promise.all(urls.map(checkUrl)).then(r => { console.log(JSON.stringify(r.filter(x => x.status === 200), null, 2)); process.exit(0); });
