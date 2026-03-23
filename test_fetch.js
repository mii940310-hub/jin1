const fetch = require('node-fetch'); // wait, node 18+ has fetch natively

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/shopping/market-prices?query=' + encodeURIComponent('정선 아우라지 미백 옥수수'));
        const data = await res.json();
        console.log("MARKET PRICES RESULT:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
