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
  'https://i.pinimg.com/236x/21/cd/13/21cd130d2dedd7eabfce6164f9bf35a4.jpg',
  'https://i.pinimg.com/236x/ff/3d/89/ff3d89d4fb0283bd782cb16b7ffc6e7f.jpg',
  'https://i.pinimg.com/236x/01/fa/a6/01faa6cc379aa69dd073c1d9b32af5bd.jpg',
  'https://i.pinimg.com/236x/e4/20/c2/e420c2a862af87b7aeb8ec68fc4ea2b9.jpg',
  'https://i.pinimg.com/236x/8a/cc/b5/8accb590e84c9886bffa3bc0a649eec2.jpg',
  'https://static.wikia.nocookie.net/naruto/images/2/21/Sasuke_Part_1.png'
];

Promise.all(urls.map(checkUrl)).then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(0); });
