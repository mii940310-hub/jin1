import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { NextResponse } from 'next/server';

type SellerAssistantRequest = {
    farmerNotes?: string;
    imageDataUrls?: string[];
};

function parseDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!match) {
        throw new Error('이미지 형식이 올바르지 않습니다.');
    }

    return {
        mimeType: match[1],
        data: match[2],
    };
}

function cleanJsonResponse(text: string) {
    return text.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.' },
                { status: 500 },
            );
        }

        const body = (await req.json()) as SellerAssistantRequest;
        const imageDataUrls = body.imageDataUrls?.filter(Boolean).slice(0, 3) ?? [];
        const farmerNotes = body.farmerNotes?.trim() ?? '';

        if (imageDataUrls.length === 0) {
            return NextResponse.json({ error: '상품 사진이 필요합니다.' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
            },
        });

        const prompt = `
당신은 "교육 없이도 바로 판매 등록을 도와주는 농산물 판매 도우미 AI"입니다.
사용자는 농업인이고, 복잡한 쇼핑몰 용어를 거의 모릅니다.
입력된 사진과 메모를 바탕으로 판매에 바로 쓸 수 있는 문구를 한국어로 생성하세요.

중요 원칙:
1. 과장 광고를 하지 말고, 사진에서 확인 가능한 정보와 일반적인 농산물 판매 표현만 사용하세요.
2. 모르면 단정하지 말고, 안전한 표현을 쓰세요. 예: "수확 후 선별 발송", "냉장 보관 권장".
3. 사용자는 초보자이므로 짧고 쉬운 표현을 우선하세요.
4. "수확일"은 실제 확정일을 모르면 오늘 날짜를 기준으로 한 권장 표기 문구와 ISO 날짜를 함께 주세요.
5. 가격은 한국 직거래 농산물 판매 관점에서 무리 없는 기본 판매가를 제안하세요.
6. category는 반드시 "vegetable" 또는 "grain" 중 하나로 반환하세요.
7. keywords는 4개 이상 8개 이하의 짧은 한국어 키워드 배열로 주세요.
8. FAQ는 배송/수확/보관/상품 상태 중심으로 3개 작성하세요.
9. naverBlogPost는 제목과 본문이 모두 들어간 완성형 글로 작성하세요.
10. kakaoPromoMessage는 바로 복사해 보낼 수 있게 5문장 이내로 작성하세요.
11. snsImageHeadline은 18자 이내, snsCaption은 2~4문장으로 작성하세요.

반환 형식:
{
  "productName": "string",
  "category": "vegetable" | "grain",
  "summary": "string",
  "description": "string",
  "harvestDate": "YYYY-MM-DD",
  "harvestDateLabel": "string",
  "storageGuide": "string",
  "shippingGuide": "string",
  "keywords": ["string"],
  "naverBlogPost": "string",
  "kakaoPromoMessage": "string",
  "snsImageHeadline": "string",
  "snsCaption": "string",
  "faq": [
    { "question": "string", "answer": "string" }
  ],
  "suggestedPrice": 0,
  "logisticsFee": 3000,
  "platformFee": 0,
  "farmerRevenue": 0,
  "recommendedStock": 20,
  "caution": "string"
}

농업인 메모:
${farmerNotes || '메모 없음'}
        `.trim();

        const parts: Part[] = [{ text: prompt }];

        for (const imageDataUrl of imageDataUrls) {
            const parsed = parseDataUrl(imageDataUrl);
            parts.push({
                inlineData: {
                    mimeType: parsed.mimeType,
                    data: parsed.data,
                },
            });
        }

        const result = await model.generateContent(parts);
        const text = result.response.text();
        const parsedResult = JSON.parse(cleanJsonResponse(text));

        return NextResponse.json(parsedResult);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'AI 생성 중 오류가 발생했습니다.';
        console.error('[SELLER_ASSISTANT_ERROR]', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
