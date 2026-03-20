const https = require('https');
const query = process.argv[2];
const options = (q) => ({
  hostname: 'openapi.naver.com',
  path: '/v1/search/shop.json?query=' + encodeURIComponent(q) + '&display=5',
  headers: {
    'X-Naver-Client-Id': 'tmnKJPxoOSlx_hunrqtH',
    'X-Naver-Client-Secret': 'IHPJqUB9QD'
  }
});
const fetchApi = (q) => new Promise((resolve) => {
  https.get(options(q), (res) => {
    let data = ''; res.on('data', c => data += c);
    res.on('end', () => resolve(JSON.parse(data).items || []));
  });
});

Promise.all([
  fetchApi(query),
  fetchApi('이마트 ' + query),
  fetchApi('롯데마트 ' + query),
  fetchApi('쿠팡 ' + query)
]).then(res => console.log(res.map(i => i[0] && i[0].lprice)));
