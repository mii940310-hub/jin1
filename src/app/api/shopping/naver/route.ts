import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) return NextResponse.json({ error: '검색어를 입력하세요.' });

    const res = await fetch(
        `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=5`,
        {
            headers: {
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '',
            },
        }
    );

    const data = await res.json();
    return NextResponse.json(data.items);
}
