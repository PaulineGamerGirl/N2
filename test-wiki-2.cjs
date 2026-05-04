const https = require('https');

function downloadHtml(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
        }).on('error', () => resolve(''));
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function searchWikiImage(title) {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  const html = await downloadHtml(url);
  const match = html.match(/<table class="infobox[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i);
  return match ? (match[1].startsWith('//') ? 'https:' + match[1] : match[1]) : null;
}

async function run() {
  const characters = [
    'Joel_(The_Last_of_Us)',
    'Ellie_(The_Last_of_Us)',
    'Cloud_Strife',
    'Tifa_Lockhart',
    'Sephiroth_(Final_Fantasy)',
    'Noctis_Lucis_Caelum',
    'Clive_Rosfield',
    'Ranni_the_Witch',
    'Malenia',
  ];
  for (const c of characters) {
    const url = await searchWikiImage(c);
    console.log(c, url);
  }
}
run();
