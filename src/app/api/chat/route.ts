import { GoogleGenerativeAI } from '@google/generative-ai';

type ProductContext = {
    ai_generated_title?: string | null;
    description?: string | null;
    harvest_date?: string | null;
    name?: string | null;
};

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(req: Request) {
    if (!apiKey) {
        return Response.json({ error: 'Gemini AI 설정이 누락되었습니다.' }, { status: 500 });
    }

    try {
        const { messages, productContext } = await req.json() as {
            messages: Array<{ content: string }>;
            productContext?: ProductContext | null;
        };

        const latestMessage = messages[messages.length - 1]?.content || '';
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const contextBlock = productContext
            ? `
[현재 상품 정보]
- 상품명: ${productContext.name || '정보 없음'}
- 보조 제목: ${productContext.ai_generated_title || '정보 없음'}
- 수확일: ${productContext.harvest_date || '정보 없음'}
- 설명: ${productContext.description || '정보 없음'}
`
            : '';

        const prompt = `
당신은 농산물 판매 서비스의 고객 응대 챗봇입니다.
주요 역할은 배송, 수확 시점, 보관법, 상품 상태, 구매 전 확인사항을 쉽고 짧게 안내하는 것입니다.

응답 지침:
1. 친근한 말투로 2~4문장 안에서 답합니다.
2. 상품 정보가 있으면 그 정보 안에서만 답합니다.
3. 모르는 내용은 지어내지 말고 "판매자 확인이 필요합니다"라고 말합니다.
4. 배송 문의에는 발송/출고 흐름을, 수확 문의에는 날짜 또는 "수확 후 순차 발송" 같은 표현을 우선 씁니다.
5. 보관 문의에는 상온/냉장 여부와 빠른 섭취 권장 정도만 간단히 안내합니다.
6. 확인되지 않은 가격 추정은 하지 않습니다.

${contextBlock}
[고객 질문]
${latestMessage}
        `.trim();

        const result = await model.generateContent(prompt);
        return Response.json({ reply: result.response.text() });
    } catch (error) {
        console.error('[CHAT_API_ERROR]', error);
        return Response.json({ error: '채팅 응답 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
