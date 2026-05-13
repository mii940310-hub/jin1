import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : '상품 설명 생성 중 오류가 발생했습니다.';
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as Record<string, unknown>;
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a professional Korean marketing copywriter for direct-from-farm products.
Create a product detail page from this input:
${JSON.stringify(body)}

Return ONLY valid JSON with these fields:
- ai_generated_title
- ai_generated_summary
- ai_generated_features
- ai_generated_description
- ai_generated_storage_guide
- ai_generated_shipping_guide
- ai_generated_faq
- ai_warning_notes`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/```json\n?/, '').replace(/```\n?/, '').trim();
        const parsedResult = JSON.parse(responseText) as unknown;

        return NextResponse.json(parsedResult);
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        console.error('[GEMINI_DESC_ERROR]', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
