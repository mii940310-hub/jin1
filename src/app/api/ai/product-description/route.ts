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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using gemini-2.5-flash instead of gemini-pro for compatibility

        const prompt = `You are a professional marketing copywriter for direct-from-farm products in South Korea.
        Create a comprehensive product detail page content based on the following input data:
        Input: ${JSON.stringify(body)}
        
        The content should emphasize freshness, farm transparency, and direct delivery. Do not use hyperbolic marketing or compare with other shopping malls.
        
        Output strictly as a JSON object with exactly these fields:
        - ai_generated_title (string, catchy Korean title)
        - ai_generated_summary (string, one line intro)
        - ai_generated_features (array of strings, 3-4 key bullet points)
        - ai_generated_description (string, main body text using markdown)
        - ai_generated_storage_guide (string, how to store)
        - ai_generated_shipping_guide (string, shipping notes)
        - ai_generated_faq (array of objects with 'q' and 'a')
        - ai_warning_notes (string, any disclaimers like shape/size variance)
        
        Return ONLY valid JSON. No markdown backticks outside or inside the JSON block if possible.
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Clean JSON backticks if present
        responseText = responseText.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
        
        const jsonResult = JSON.parse(responseText);

        return NextResponse.json(jsonResult);
    } catch (error: any) {
        console.error('[GEMINI_DESC_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
