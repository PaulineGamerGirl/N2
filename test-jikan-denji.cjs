const https = require('https');

function searchCharacter(name) {
  return new Promise((resolve) => {
    https.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
             for(let i=0; i<Math.min(3, json.data.length); i++) {
                 console.log(name, i, json.data[i].images.jpg.image_url, json.data[i].name);
             }
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

searchCharacter('Denji');
