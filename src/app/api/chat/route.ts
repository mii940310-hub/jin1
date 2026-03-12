import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    if (!apiKey) {
        return Response.json({ error: "Gemini AI 설정이 누락되었습니다." }, { status: 500 });
    }

    try {
        const { messages } = await req.json();
        const latestMessage = messages[messages.length - 1].content;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `
당신은 강원도 고랭지 농산물 산지직송 직거래 플랫폼 '슝팜'의 스마트 상담사 '슝이'입니다.
고객들은 주로 배추, 무, 감자, 옥수수 등 강원도 특산물에 대해 문의합니다.
당신의 임무:
1. 김장하기 좋은 시기, 채소 보관법, 고랭지 농산물의 특징 등 전문 지식을 친절하게 안내합니다.
2. 답변은 읽기 쉽고 간결하게, 3~4문장 이내로 답변하세요.
3. 친근하고 활기찬 이모티콘을 적절히 사용하세요 (예: 🥬, 🥔, 🌽, 🚚, 😊).
4. 가격이나 주문 관련 상세 내역은 '장바구니'나 '마이페이지'를 확인해 달라고 안내하세요.

고객의 최신 질문: ${latestMessage}
`;

        const result = await model.generateContent(systemInstruction);
        const responseText = result.response.text();

        return Response.json({ reply: responseText });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return Response.json({ error: "채팅 응답 중 오류가 발생했습니다." }, { status: 500 });
    }
}
