const https = require('https');

function downloadHtml(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function searchWikiImage(title) {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  const html = await downloadHtml(url);
  const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
  return match ? match[1] : null;
}

async function run() {
  const characters = [
    'Joel (The Last of Us)',
    'Ellie (The Last of Us)',
    'Cloud Strife',
    'Tifa Lockhart',
    'Sephiroth',
    'Noctis Lucis Caelum',
    'Clive Rosfield',
    'Cidolfus Telamon', // Might not have individual page
    'Player character (Elden Ring)', // The Tarnished
    'Ranni the Witch',
    'Malenia',
  ];
  for (const c of characters) {
    const url = await searchWikiImage(c);
    console.log(c, url);
  }
}
run();
