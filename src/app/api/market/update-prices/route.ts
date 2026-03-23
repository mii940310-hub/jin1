import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서비스 롤 클라이언트 (DB 쓰기 권한) - 빌드 타임 에러 방지를 위해 지연 초기화(Lazy Initialization)
const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
    );
};

// 네이버 쇼핑 API로 상품 가격 검색
async function fetchNaverPrices(keyword: string): Promise<number[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) return [];

    try {
        const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=10&sort=sim`;
        const res = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) return [];

        const data = await res.json();
        const items = data.items as Array<{ lprice: string; mallName: string; title: string }>;

        // 유효 가격만 추출 (0원 제외)
        const prices = items
            .map(item => parseInt(item.lprice, 10))
            .filter(p => p > 0);

        return prices;
    } catch {
        return [];
    }
}

// 이마트 / 쿠팡 가격은 네이버 쇼핑 내에서 출처 구분으로 대체
// (공식 API가 없는 경우 네이버 쇼핑 검색 결과를 출처별로 분리)
async function fetchNaverPricesByMall(keyword: string): Promise<{
    naver: number[]; emart: number[]; coupang: number[]; other: number[];
}> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    const result = { naver: [] as number[], emart: [] as number[], coupang: [] as number[], other: [] as number[] };

    if (!clientId || !clientSecret) return result;

    try {
        const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=30&sort=sim`;
        const res = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) return result;

        const data = await res.json();
        const items = data.items as Array<{ lprice: string; mallName: string; title: string }>;

        for (const item of items) {
            const price = parseInt(item.lprice, 10);
            if (price <= 0) continue;

            const mall = item.mallName.toLowerCase();
            if (mall.includes('이마트') || mall.includes('emart')) {
                result.emart.push(price);
            } else if (mall.includes('쿠팡') || mall.includes('coupang')) {
                result.coupang.push(price);
            } else if (mall.includes('네이버') || mall.includes('naver')) {
                result.naver.push(price);
            } else {
                result.other.push(price);
            }
        }

        // 네이버 기본 수집
        if (result.naver.length === 0) {
            result.naver = items
                .slice(0, 10)
                .map(i => parseInt(i.lprice, 10))
                .filter(p => p > 0);
        }
    } catch {
        // 에러 무시
    }

    return result;
}

// 숫자 배열 평균 계산
function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// 검색할 기본 키워드 목록 (카테고리별)
const PRODUCT_KEYWORDS = [
    { keyword: '배추 10kg', category: 'vegetable' },
    { keyword: '무 10kg', category: 'vegetable' },
    { keyword: '양파 10kg', category: 'vegetable' },
    { keyword: '감자 10kg', category: 'grain' },
    { keyword: '고구마 10kg', category: 'grain' },
    { keyword: '옥수수 10kg', category: 'grain' },
    { keyword: '당근 10kg', category: 'vegetable' },
    { keyword: '대파 10kg', category: 'vegetable' },
    { keyword: '상추 1kg', category: 'vegetable' },
    { keyword: '쌀 10kg', category: 'grain' },
];

export async function POST(req: NextRequest) {
    // 간단한 보안: 내부 호출 확인 (cron job 에서만 호출 가능)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'jin1-cron-secret-2024';

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const results: Array<{ keyword: string; status: string; avgMarketPrice?: number; recommendedPrice?: number }> = [];

    for (const { keyword, category } of PRODUCT_KEYWORDS) {
        try {
            const mallPrices = await fetchNaverPricesByMall(keyword);

            // 각 출처별 평균 계산
            const avgNaver = avg(mallPrices.naver);
            const avgEmart = avg(mallPrices.emart);
            const avgCoupang = avg(mallPrices.coupang);
            const avgOther = avg(mallPrices.other);

            // 유효한 출처만 모아 전체 평균 계산
            const validPrices: number[] = [];
            const sourcesObj: Record<string, number> = {};

            if (avgNaver > 0) { validPrices.push(avgNaver); sourcesObj['네이버쇼핑'] = avgNaver; }
            if (avgEmart > 0) { validPrices.push(avgEmart); sourcesObj['이마트'] = avgEmart; }
            if (avgCoupang > 0) { validPrices.push(avgCoupang); sourcesObj['쿠팡'] = avgCoupang; }
            if (avgOther > 0 && validPrices.length < 2) { validPrices.push(avgOther); sourcesObj['기타'] = avgOther; }

            // 유효 가격이 없으면 스킵
            if (validPrices.length === 0) {
                results.push({ keyword, status: '가격 없음' });
                continue;
            }

            const avgMarketPrice = avg(validPrices);
            const recommendedPrice = Math.round(avgMarketPrice * 0.7); // 30% 할인

            // DB에 개별 마트 가격 저장
            const priceEntries = Object.entries(sourcesObj).map(([sourceName, price]) => ({
                product_keyword: keyword,
                category,
                source: sourceName.toLowerCase().replace(' ', '_'),
                source_name: sourceName,
                price,
                fetched_at: new Date().toISOString(),
            }));

            if (priceEntries.length > 0) {
                // 오늘 데이터 삭제 후 새로 삽입
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const supabaseAdmin = getSupabaseAdmin();
                await supabaseAdmin
                    .from('market_price_references')
                    .delete()
                    .eq('product_keyword', keyword)
                    .gte('fetched_at', todayStart.toISOString());

                await supabaseAdmin
                    .from('market_price_references')
                    .insert(priceEntries);
            }

            // 요약 테이블 upsert
            const supabaseAdmin = getSupabaseAdmin();
            await supabaseAdmin
                .from('market_price_summary')
                .upsert({
                    product_keyword: keyword,
                    category,
                    avg_market_price: avgMarketPrice,
                    recommended_price: recommendedPrice,
                    price_sources: sourcesObj,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'product_keyword' });

            results.push({
                keyword,
                status: '성공',
                avgMarketPrice,
                recommendedPrice,
            });
        } catch (err: any) {
            results.push({ keyword, status: `오류: ${err.message}` });
        }
    }

    return NextResponse.json({
        success: true,
        updatedAt: new Date().toISOString(),
        results,
    });
}

// GET: Vercel Cron Job이 매일 자동 호출하는 핸들러
export async function GET(req: NextRequest) {
    // Vercel Cron은 Authorization 헤더를 포함해 GET으로 호출
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'jin1-cron-secret-2024';

    // authorization 헤더가 있으면 cron 실행, 없으면 요약 조회
    if (authHeader === `Bearer ${cronSecret}`) {
        // Cron 실행 모드: POST와 동일한 로직 수행
        const fakeReq = new Request(req.url, {
            method: 'POST',
            headers: { 'authorization': authHeader },
        }) as NextRequest;
        return POST(fakeReq);
    }

    // 일반 조회 모드
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('market_price_summary')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
