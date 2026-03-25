import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    if (!apiKey) {
        return Response.json({ error: "Gemini AI 설정이 누락되었습니다." }, { status: 500 });
    }

    try {
        const { messages, productContext } = await req.json();
        const latestMessage = messages[messages.length - 1].content;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let contextInfo = '';
        if (productContext) {
            contextInfo = `
[현재 고객이 보고 있는 상품 정보]
- 상품명/타이틀: ${productContext.name} / ${productContext.ai_generated_title || ''}
- 수확(예정)일: ${productContext.harvest_date}
- AI 추천가/이유: ${productContext.ai_price_recommendation || '정보없음'} / ${productContext.ai_price_reason || '정보없음'}
- 기본 설명: ${productContext.description}

위 상품 정보를 참고하여 고객이 묻는 정보(수확일, 상세 등)에 즉시 정확히 답변하세요.`;
        }

        const systemInstruction = `
당신은 농가와 소비자를 잇는 똑똑한 산지직송 직거래 플랫폼 '슝팜'의 AI 상담사 '슝이'입니다.
농가는 제값을 받고, 소비자는 그 가격이 어떻게 구성되었는지 투명하게 알아야 한다는 것이 슝팜의 핵심 철학입니다.
${contextInfo}

당신의 임무:
1. 가격 산정의 이유를 묻는 질문이 들어오면, 무조건 "장바구니 확인"이 아니라 "슝팜은 무리한 최저가 경쟁을 하지 않으며, 농가의 정당한 마진(농가 수취액)과 물류, 포장비 등 원가를 투명하게 산정하여 합리적인 가격을 제안하고 있습니다" 라고 설명해야 합니다.
2. 슝팜은 단순한 쇼핑몰을 넘어, AI가 상품 설명을 작성하고 마진과 규격을 스마트하게 분석해주는 '상생 IT 플랫폼'임을 강조하세요.
3. 배추, 무, 감자, 옥수수 등 산지 상황이나 과대 포장 방지를 위한 AI의 '규격 표준화' 가이드에 대해서도 어필할 수 있습니다.
4. 답변은 읽기 쉽고 간결하게, 3~4문장 이내로 답변하세요.
5. 친근하고 활기찬 이모티콘을 적절히 사용하세요 (예: 🥬, 🥔, 🌽, 🚚, 😊, 💡).
6. 소비자가 직접 가격 구조를 납득하고 가치를 소비할 수 있도록 돕는 스마트한 조력자 역할을 유지하세요.

고객의 최근 질문: ${latestMessage}
`;

        const result = await model.generateContent(systemInstruction);
        const responseText = result.response.text();

        return Response.json({ reply: responseText });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return Response.json({ error: "채팅 응답 중 오류가 발생했습니다." }, { status: 500 });
    }
}
