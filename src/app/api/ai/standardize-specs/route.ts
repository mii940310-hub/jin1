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

        const prompt = `You are an operational assistant for direct-from-farm products in South Korea.
        Standardize the product's weight, quantity, and sizing logic to prevent any consumer misunderstandings before purchase.
        Input Data: ${JSON.stringify(body)}
        
        Output strictly as a JSON object with exactly these fields:
        - ai_standardized_spec (string, clear standardized string e.g., "1 box (5kg)")
        - ai_quantity_guide (string, e.g., "Approx. 10-12 apples per box")
        - ai_household_guide (string, e.g., "Perfect for a 4-person family for a week")
        - ai_packaging_note (string, e.g., "Includes box weight (0.5kg)")
        - ai_confusion_warning (string, e.g., "Warning: Natural products vary in size. Weight is accurate.")
        
        Return ONLY valid JSON.
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
        const jsonResult = JSON.parse(responseText);

        return NextResponse.json(jsonResult);
    } catch (error: any) {
        console.error('[GEMINI_SPECS_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
