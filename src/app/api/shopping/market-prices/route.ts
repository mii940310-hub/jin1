import { NextResponse } from 'next/server';

function normalizeName(name: string) {
    let clean = name.replace(/[^\w\s가-힣]/g, ' ');
    const uselessWords = ['프리미엄', '특품', '당일수확', '행사', '추천', '아우라지', '박스'];
    uselessWords.forEach(word => {
        clean = clean.replace(new RegExp(word, 'g'), ' ');
    });
    return clean.replace(/\s+/g, ' ').trim();
}

function getCoreKeyword(name: string) {
    const parts = name.trim().split(' ');
    // Return last word, defaults to 농산물
    return parts.length > 0 ? parts[parts.length - 1] : '농산물';
}

function generateFallbackQueries(originalName: string) {
    const clean = normalizeName(originalName);
    const core = getCoreKeyword(clean);
    
    const queries = [];
    queries.push(originalName);
    if (originalName !== clean) queries.push(clean);
    
    const parts = clean.split(' ');
    if (parts.length > 2) {
        queries.push(parts.slice(-2).join(' ')); // e.g. "미백 옥수수" if "정선 미백 옥수수"
    }

    if (core) {
        queries.push(`생 ${core}`);
        queries.push(`신선 ${core}`);
        queries.push(core);
    } else if (clean.includes('옥수수')) {
        queries.push(`생 옥수수`);
        queries.push(`신선 옥수수`);
        queries.push(`옥수수`);
    }

    // Unique non-empty values
    return Array.from(new Set(queries)).filter(q => q.trim().length > 0);
}

function isProcessedFood(itemName: string) {
    const excludedKeywords = [
        "냉동", "냉장조리", "삶은", "찐", "즉석", "간편", "레토르트",
        "통조림", "캔", "스프", "가루", "분말", "차", "스낵", "팝콘",
        "콘샐러드", "옥수수알", "커널", "가공", "반조리", "초당옥수수 가공품"
    ];
    return excludedKeywords.some(kw => itemName.includes(kw));
}

function extractWeightInKg(title: string): number | null {
    // 10kg, 5kg, 3.5kg
    let match = title.match(/([0-9.]+)\s*kg/i);
    if (match) return parseFloat(match[1]);
    
    // 500g, 1000g
    match = title.match(/([0-9,]+)\s*g/i);
    if (match) {
        const g = parseInt(match[1].replace(/,/g, ''));
        if (g >= 100) return g / 1000;
    }
    
    // 개 단위 (보조 수단) - 옥수수 등은 1개당 보통 150g~200g
    match = title.match(/([0-9]+)\s*(입|개)/);
    if (match && title.includes('옥수수')) {
        const count = parseInt(match[1]);
        if (count >= 5) return (count * 150) / 1000; // 보수적으로 개당 150g 잡음
    }

    return null;
}

async function searchWithFallback(storeName: string, originalName: string) {
    const queries = generateFallbackQueries(originalName);
    const aliases: { [key: string]: string[] } = {
        '이마트몰': ['이마트', 'SSG.COM', '신세계몰', '이마트몰'],
        'G마켓': ['G마켓', 'Gmarket', '지마켓', '지에스홈쇼핑', 'g마켓'],
        '네이버': ['네이버', 'Naver']
    };
    const targetAliases = aliases[storeName as keyof typeof aliases] || [storeName];
    
    let logs: string[] = [];

    for (const query of queries) {
        let fetchUrl = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent((storeName === '네이버' ? '' : storeName + ' ') + query)}&display=40`;
        
        try {
            const res = await fetch(fetchUrl, {
                headers: {
                    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
                    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '',
                },
                next: { revalidate: 3600 }
            });
            
            if (!res.ok) {
                logs.push(`[${query}] API 응답 상태 코드: ${res.status} (실패)`);
                continue;
            }
            
            const data = await res.json();
            const items = data.items || [];
            
            if (items.length === 0) {
                logs.push(`[${query}] 응답 성공, 결과 개수: 0개`);
                continue;
            }

            let validItemsPriceList: { price: number; name: string }[] = [];

            // 필터링 및 단위량(1kg) 단가 환산 (매우 중요)
            for (const item of items) {
                const title = item.title.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
                const price = parseInt(item.lprice);
                
                const mallMatches = targetAliases.some(alias => item.mallName.includes(alias));
                if (!mallMatches && storeName !== '네이버') continue; // 해당 몰 아니면 스킵

                // 냉동/가공/기타 부적합 제외
                if (isProcessedFood(title)) continue; 
                
                // 상품명에서 중량(kg) 추출
                const wInKg = extractWeightInKg(title);
                if (!wInKg) continue;

                // 1kg 단위 표준 단가로 변환 (너무 비정상적인 단가는 파싱 오류로 간주하고 제외: 1kg당 10만원 이상이거나 100원 이하)
                const normalized1kgPrice = Math.round(price / wInKg);
                if (normalized1kgPrice < 500 || normalized1kgPrice > 50000) continue;
                
                validItemsPriceList.push({ price: normalized1kgPrice, name: title });
            }

            if (validItemsPriceList.length > 0) {
                // 이상치 방지를 위해 오름차순 정렬 후 중앙값(대표성 있는 무난한 가격) 사용
                validItemsPriceList.sort((a, b) => a.price - b.price);
                const medianIndex = Math.floor(validItemsPriceList.length / 2);
                const medianItem = validItemsPriceList[medianIndex];
                
                logs.push(`[${query}] 1kg 다수 파싱 완료(${validItemsPriceList.length}건). 중앙값 적용: "${medianItem.name}" (원가격: ${medianItem.price}원 / 1kg 환산 적용 완료)`);
                return { price: medianItem.price, name: medianItem.name, logs };
            } else {
                logs.push(`[${query}] 필터링 결과 0개. 사유: 유효 중량 부족 또는 터무니없는 단가(파싱 오류 방지).`);
            }

        } catch (e: any) {
            logs.push(`[${query}] API 네트워크 에러: ${e.message}`);
        }
    }
    
    return { price: null, name: null, logs };
}

// 메모리 캐시 추가 (개발 환경 및 반복 조회 시 가격 변동 방지)
const memCache: Record<string, { data: any, timestamp: number }> = {};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) return NextResponse.json({ error: '검색어를 입력하세요.' }, { status: 400 });

    const now = Date.now();
    // 1시간(3600초) 캐시 유지
    if (memCache[query] && (now - memCache[query].timestamp < 3600 * 1000)) {
        return NextResponse.json(memCache[query].data);
    }

    try {
        const [naverRes, emartRes, gmarketRes] = await Promise.all([
            searchWithFallback('네이버', query),
            searchWithFallback('이마트몰', query),
            searchWithFallback('G마켓', query)
        ]);
        
        // 개발자/관리자 로그 출력 (요청사항 7 반영)
        console.log(`\n=== [시장가 분석 로그] 상품명: ${query} ===`);
        console.log(`[이마트 API 현황]`);
        emartRes.logs.forEach(l => console.log(`  - ${l}`));
        console.log(`[G마켓 API 현황]`);
        gmarketRes.logs.forEach(l => console.log(`  - ${l}`));
        console.log(`[네이버 API 현황]`);
        naverRes.logs.forEach(l => console.log(`  - ${l}`));
        console.log(`====================================================\n`);

        const result = {
            naver: naverRes.price,
            naverName: naverRes.name,
            emart: emartRes.price,
            emartName: emartRes.name,
            gmarket: gmarketRes.price,
            gmarketName: gmarketRes.name,
            logs: { emart: emartRes.logs, gmarket: gmarketRes.logs, naver: naverRes.logs }
        };

        memCache[query] = { data: result, timestamp: now };
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: 'API 연동 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
