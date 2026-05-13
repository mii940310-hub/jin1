import { NextResponse } from 'next/server';
import OpenAI from 'openai';

type AutoSellerRequest = {
    imageUrls?: string[];
    voiceText?: string;
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'AI 자동 판매 생성 중 오류가 발생했습니다.';
}

function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    return new OpenAI({ apiKey });
}

export async function POST(request: Request) {
    try {
        const { imageUrls = [], voiceText = '' } = await request.json() as AutoSellerRequest;

        if (!voiceText.trim()) {
            return NextResponse.json({ error: '음성 설명이 필요합니다.' }, { status: 400 });
        }

        const userContent: Array<Record<string, unknown>> = [
            {
                type: 'text',
                text: `판매자 음성 설명: "${voiceText}"\n이 설명과 첨부 이미지를 바탕으로 상품 정보를 생성해 주세요.`,
            },
        ];

        for (const url of imageUrls) {
            if (!url) {
                continue;
            }

            userContent.push({
                type: 'image_url',
                image_url: { url },
            });
        }

        const messages = [
            {
                role: 'system',
                content: `당신은 한국 농산물 직거래 판매를 돕는 AI 판매 도우미입니다.
판매자가 보낸 이미지와 음성 설명을 바탕으로 상품 정보를 생성합니다.
반드시 아래 JSON 구조로만 응답하세요.

{
  "product": {
    "name": "DB 저장용 상품명",
    "category": "vegetable 또는 grain",
    "title": "소비자용 매력적인 제목",
    "description": "상세 설명",
    "storageGuide": "보관 및 배송 안내",
    "features": ["특징 1", "특징 2", "특징 3"]
  },
  "promotion": {
    "blog": "네이버 블로그 초안",
    "kakao": "카카오톡 홍보 메시지"
  }
}`,
            },
            {
                role: 'user',
                content: userContent,
            },
        ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content || '{}';
        const parsedResult = JSON.parse(content) as unknown;

        return NextResponse.json(parsedResult);
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        console.error('AI Auto-Seller Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
