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
            resolve({ name, url: json.data[0].images.jpg.image_url });
          } else {
            resolve({ name, url: null });
          }
        } catch (e) {
          resolve({ name, url: null });
        }
      });
    }).on('error', () => resolve({ name, url: null }));
  });
}

const characters = ['Aki Hayakawa', 'Kirara Hoshi', 'Kinji Hakari', 'Sasuke Uchiha'];

Promise.all(characters.map(searchCharacter)).then(r => {
  console.log(JSON.stringify(r, null, 2));
});
