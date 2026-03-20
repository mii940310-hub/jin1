const https = require('https');
const options = {
  hostname: 'openapi.naver.com',
  path: '/v1/search/shop.json?query=' + encodeURIComponent('정선 옥수수 3kg') + '&display=100',
  headers: {
    'X-Naver-Client-Id': 'tmnKJPxoOSlx_hunrqtH',
    'X-Naver-Client-Secret': 'IHPJqUB9QD'
  }
};
https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.items.map(i => `${i.mallName}: ${i.lprice}`).slice(0, 20));
    } catch (e) { console.error(e); }
  });
});
