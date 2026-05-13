import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

type ChatRequest = {
    history?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    message?: string;
    productId?: string;
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : '챗봇 응답 생성 중 오류가 발생했습니다.';
}

function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    return new OpenAI({ apiKey });
}

function getSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase 서비스 역할 환경 변수가 설정되지 않았습니다.');
    }

    return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: Request) {
    try {
        const { productId, message = '', history = [] } = await request.json() as ChatRequest;

        if (!message.trim()) {
            return NextResponse.json({ error: '메시지가 필요합니다.' }, { status: 400 });
        }

        let contextData = '';
        const supabase = getSupabaseAdminClient();

        if (productId) {
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (!error && product) {
                contextData = `
현재 문의 중인 상품 정보:
- 이름: ${product.name}
- 카테고리: ${product.category}
- AI 생성 설명: ${product.ai_generated_description || ''}
- 특징: ${Array.isArray(product.ai_generated_features) ? product.ai_generated_features.join(', ') : ''}
- 보관 및 배송 안내: ${product.ai_generated_storage_guide || ''}
`;
            }
        }

        const messages = [
            {
                role: 'system',
                content: `당신은 Highland Fresh 고객 상담 챗봇입니다.
고객 질문에 빠르고 친절하게 답변하세요.
확인되지 않은 정보는 추정하지 말고, 농가 확인이 필요하다고 안내하세요.
답변은 짧고 이해하기 쉽게 작성하세요.

[상품 컨텍스트]
${contextData}
[/상품 컨텍스트]`,
            },
            ...history,
            {
                role: 'user',
                content: message,
            },
        ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
        });

        return NextResponse.json({ reply: completion.choices[0]?.message?.content || '' });
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        console.error('Chatbot API Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
