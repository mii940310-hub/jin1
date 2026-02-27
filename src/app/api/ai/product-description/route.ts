import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const { category, farmName, harvestDate } = await req.json();

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                error: "GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
            }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `You are a professional marketing copywriter for high-end organic farm products in South Korea.
    Write a poetic, trustworthy, and appealing product description for the following:
    - Product: ${category}
    - Farm: ${farmName}
    - Harvest Date: ${harvestDate}
    
    The description should emphasize the clean air, pure water, and unique climate of Gangwon-do's high altitude (Goraengji). 
    Use a warm and inviting tone. Write in Korean.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return NextResponse.json({
            description: responseText,
        });
    } catch (error: any) {
        console.error('[GEMINI_DESC_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
