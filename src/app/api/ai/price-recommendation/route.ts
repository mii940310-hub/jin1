import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { category, currentPrice, harvestDate, productName } = await req.json();

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: "GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
            }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `당신은 대한민국 강원도 고랭지 농산물 전문 시장 분석가입니다.
    다음 상품에 대한 가격 적정성을 분석해 주세요:
    - 상품명: ${productName || '알 수 없는 품목'}
    - 카테고리: ${category}
    - 농가 희망 수취가: ${currentPrice}원
    - 수확 예정일: ${harvestDate}
    
    전문적인 가격 추천과 시장 전망을 한국어로 제공해 주세요. 
    특히 농가가 부담해야 하는 포장지 비용, 포장 인건비, 물류비 등의 부대 비용을 충분히 감안해 주세요.
    소비자에게 저렴한 가격에 제공하는 것도 좋지만, 농가에게 조금 더 많은 혜택과 정당한 이윤이 돌아가는 방향으로 가격을 지지하고 분석해 주세요. 
    배추 일색의 조언이 아니라 입력된 '상품명'을 중심으로 분석해야 합니다.
    
    답변은 반드시 다음 JSON 형식으로만 작성해 주세요:
    {
      "recommendedPrice": 농가 권장 수취가 (숫자만 입력, 예: 8500),
      "reasoning": "분석 결과 및 추천 이유 (친절하고 전문적인 블로그 톤으로 길고 상세하게 작성)"
    }`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Remove markdown formatting if presents
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const data = JSON.parse(responseText);

        return NextResponse.json({
            recommendedPrice: Number(data.recommendedPrice),
            reasoning: data.reasoning,
        });
    } catch (error: any) {
        console.error('[GEMINI_PRICE_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
