const https = require('https');

function extractWeightInKg(title) {
    let match = title.match(/([0-9.]+)\s*kg/i);
    if (match) return parseFloat(match[1]);
    
    match = title.match(/([0-9,]+)\s*g/i);
    if (match) {
        const g = parseInt(match[1].replace(/,/g, ''));
        if (g >= 100) return g / 1000;
    }
    
    match = title.match(/([0-9]+)\s*(입|개)/);
    if (match && title.includes('옥수수')) {
        const count = parseInt(match[1]);
        if (count >= 5) return (count * 150) / 1000;
    }

    return null;
}

const NAVER_CLIENT_ID = 'tmnKJPxoOSlx_hunrqtH'; // From env
const NAVER_CLIENT_SECRET = 'IHPJqUB9QD';

const query = '정선 아우라지 미백 옥수수';
const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=40`;

https.get(url, {
    headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log(`Found ${json.items?.length || 0} items`);
        json.items?.forEach(item => {
            const title = item.title.replace(/<\/?[^>]+(>|$)/g, "");
            const w = extractWeightInKg(title);
            if (w) {
                const p = parseInt(item.lprice);
                console.log(`[${w}kg] ${p}원 -> kg당 ${Math.round(p/w)}원 : ${title}`);
            } else {
                console.log(`[No Weight] ${title}`);
            }
        });
    });
});
