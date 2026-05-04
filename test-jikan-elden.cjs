const https = require('https');

function searchCharacter(name) {
  return new Promise((resolve) => {
    https.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
             console.log(name, json.data[0].images.jpg.image_url, json.data[0].name, json.data[0].about ? json.data[0].about.substring(0, 50) : '');
             resolve();
          } else {
            resolve();
          }
        } catch (e) {
          resolve();
        }
      });
    }).on('error', () => resolve());
  });
}

async function run() {
  await searchCharacter('The Tarnished');
  await searchCharacter('White Mask Varre');
  await searchCharacter('Ranni the Witch');
  await searchCharacter('Malenia');
  await searchCharacter('Joel');
  await searchCharacter('Ellie');
  await searchCharacter('Clive Rosfield');
  await searchCharacter('Cidolfus Telamon');
}
run();
