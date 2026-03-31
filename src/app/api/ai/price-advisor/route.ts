import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: "GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다."
            }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // AI가 농가의 기존 입력 가격에 '가스라이팅(Anchoring)' 당하는 것을 원천 차단하기 위해
        // 가격 관련 필드를 입력 데이터에서 완전히 제거하고 순수 스펙만 전달합니다.
        const blindData = {
            name: body.name,
            category: body.category,
            weight_kg: body.weight_kg,
            weight_unit: body.weight_unit,
            weight_type: body.weight_type,
            harvest_date: body.harvest_date,
            description: body.description
        };

        const prompt = `당신은 대한민국 산지직송 농산물 전문 AI 프라이싱 애널리스트입니다.
다음 데이터를 바탕으로, 대한민국의 일반적인 산지직송 농산물 단가를 유추하여 '가장 객관적이고 적정한 슝팜 투명 추천 판매가'를 계산하세요.

[입력 데이터 (농가 희망가는 블라인드 처리됨)]: ${JSON.stringify(blindData)}

[시스템 규칙 - 반드시 지킬 것!]
1. AI는 오직 농산물의 '이름, 종류, 규격, 무게단위' 정보만으로 대한민국의 평균적인 온오프라인 산지직송 도소매 시세를 매우 정확하게 추정해내야 합니다.
2. 슝팜의 **플랫폼 수수료는 무조건 '최종 추천 판매가의 10%' (또는 농가수취액+물류비의 11.1%)**로 고정되어 있습니다. 계산 시 수수료율이 10%를 초과하거나 미달하지 않도록 정확히 계산하세요 (15% 절대 금지).
3. 외부 쇼핑몰(네이버, 이마트 등)은 절대 언급하지 말고, 오직 '농가 수취액 + 포장/물류/작업비 + 플랫폼 수수료'의 투명한 기준으로 산출 근거를 설명하세요.
4. 모든 텍스트(ai_price_reason, ai_price_warning)는 무조건 한국어로 자연스럽게 작성하며, 수수료가 10%임을 명시하세요.

[출력 형식]
오직 아래의 정확한 JSON 객체 형태로만 출력하세요 (마크다운 \`\`\`json 코드는 제외):
{
  "ai_price_recommendation": (숫자, 최종 추천 판매가),
  "ai_price_range_min": (숫자, 추천 최소가),
  "ai_price_range_max": (숫자, 추천 최대가),
  "ai_price_reason": "(문자열, 왜 이 가격을 추천하는지 객관적 시세와 투명한 원가 구조를 바탕으로 한글로 설명)",
  "ai_price_warning": "(문자열 또는 null, 예: '입력하신 희망가가 산지 적정가 대비 비쌉니다/저렴합니다'),
  "ai_price_breakdown": {
    "farmer_revenue": (숫자, 농가 순수취액),
    "logistics": (숫자, 택배비 및 포장작업비, 보통 3000~6000원 선),
    "fee": (숫자, 정확히 총 판매가의 10%)
  }
}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
        const jsonResult = JSON.parse(responseText);

        return NextResponse.json(jsonResult);
    } catch (error: any) {
        console.error('[GEMINI_PRICE_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
