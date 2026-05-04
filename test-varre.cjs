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

async function run() {
  const html = await downloadHtml('https://eldenring.wiki.fextralife.com/White-Faced+Varre');
  const matches = html.match(/src="([^"]+varre[^"]+)"/ig);
  console.log(matches ? matches.slice(0, 5) : 'No matches');
}
run();
