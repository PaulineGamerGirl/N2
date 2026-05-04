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

const characters = [
  "Joel", "Ellie",
  "Cloud Strife", "Tifa Lockhart", "Sephiroth",
  "Noctis",
  "Clive Rosfield", "Cidolfus Telamon",
  "The Tarnished", "White Mask Varre", "Ranni the Witch", "Malenia",
  "Denji", "Aki Hayakawa", "Makima",
  "Yuji Itadori", "Satoru Gojo", "Kirara Hoshi", "Kinji Hakari",
  "Naruto Uzumaki", "Sasuke Uchiha", "Kakashi Hatake",
  "Light Yagami", "L", "Ryuk"
];

async function run() {
  for (const char of characters) {
    const res = await searchCharacter(char);
    console.log(`'${res.name.toLowerCase()}': '${res.url}',`);
    await new Promise(r => setTimeout(r, 400)); // rate limit
  }
}
run();
