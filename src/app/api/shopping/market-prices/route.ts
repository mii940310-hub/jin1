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

            let validItems = 0;
            let exactMallFound = false;
            let firstUsedName = '';
            let validPrice = null;

            // 필터링
            for (const item of items) {
                const title = item.title.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
                const price = parseInt(item.lprice);
                
                const mallMatches = targetAliases.some(alias => item.mallName.includes(alias));
                if (!mallMatches && storeName !== '네이버') continue; // 해당 몰 아니면 스킵

                // 냉동/가공 제외
                if (isProcessedFood(title)) continue; 
                
                // 통과
                validItems++;
                if (validItems === 1) { 
                    exactMallFound = true;
                    firstUsedName = title;
                    validPrice = price;
                }
            }

            if (exactMallFound) {
                logs.push(`[${query}] 적용상품명: "${firstUsedName}" (원가격: ${validPrice}원)`);
                return { price: validPrice, name: firstUsedName, logs };
            } else {
                logs.push(`[${query}] 필터링 결과 0개. 사유: 냉동/가공품만 존재하거나 중량(kg) 정보가 불명확함.`);
            }

        } catch (e: any) {
            logs.push(`[${query}] API 네트워크 에러: ${e.message}`);
        }
    }
    
    return { price: null, name: null, logs };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) return NextResponse.json({ error: '검색어를 입력하세요.' }, { status: 400 });

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

        return NextResponse.json({
            naver: naverRes.price,
            naverName: naverRes.name,
            emart: emartRes.price,
            emartName: emartRes.name,
            gmarket: gmarketRes.price,
            gmarketName: gmarketRes.name,
            logs: { emart: emartRes.logs, gmarket: gmarketRes.logs, naver: naverRes.logs }
        });
    } catch (e) {
        return NextResponse.json({ error: 'API 연동 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
