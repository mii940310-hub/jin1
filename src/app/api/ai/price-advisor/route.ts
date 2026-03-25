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

        const prompt = `You are a pricing analyst for direct-from-farm products in South Korea.
        Calculate an appropriate internal selling price recommendation based strictly on internal factors (shipping cost, packaging cost, platform fee, weight, product quality).
        Input Data: ${JSON.stringify(body)}
        
        Do NOT mention external marketplaces (Naver, Emart, etc.) or compare prices with them. Justify the price using farm revenue, logistics, and quality logic.
        
        Output strictly as a JSON object with exactly these fields:
        - ai_price_recommendation (number, total recommended price)
        - ai_price_range_min (number)
        - ai_price_range_max (number)
        - ai_price_reason (string, why this price is fair)
        - ai_price_warning (string or null, e.g., "Warning: Farm net profit is too low")
        - ai_price_breakdown (object, estimated breakdown of costs like { farmer_revenue: 10000, fee: 1000, logistics: 2500 })
        
        Return ONLY valid JSON.
        `;

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
