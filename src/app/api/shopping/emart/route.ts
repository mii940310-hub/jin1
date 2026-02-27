import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url'); // 이마트나 G마켓 상품 상세 페이지 주소

    if (!targetUrl) return NextResponse.json({ error: '상품 주소를 입력하세요.' });

    const scraperApiKey = process.env.SHOPPING_SCRAPER_API_KEY;

    // ScraperAPI를 통해 이마트/G마켓 페이지 내용을 긁어옵니다.
    const res = await fetch(
        `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`
    );

    const html = await res.text();

    // 여기에 나중에 HTML에서 가격만 쏙 뽑아내는 로직을 추가할 거예요.
    // 우선은 연결이 잘 되는지 확인하기 위해 성공 메시지를 보냅니다.
    return NextResponse.json({ message: "이마트 데이터를 성공적으로 가져왔습니다.", length: html.length });
}
