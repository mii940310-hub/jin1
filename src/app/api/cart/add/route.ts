import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type WeightType = 'fixed' | 'range' | 'variable';

type AddCartRequestBody = {
    metadata?: {
        selected_option_index?: number | null;
        selected_quantity?: number;
        weight_type?: WeightType;
        weight_unit?: string | null;
    };
    productId?: string;
    quantity?: number;
};

function buildError(message: string, status = 400) {
    return NextResponse.json({ success: false, message }, { status });
}

function getRequiredEnv(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name}가 설정되지 않았습니다.`);
    }

    return value;
}

function getBearerToken(req: NextRequest) {
    const authorization = req.headers.get('authorization');

    if (!authorization?.toLowerCase().startsWith('bearer ')) {
        return null;
    }

    return authorization.slice('bearer '.length).trim();
}

export async function POST(req: NextRequest) {
    try {
        const token = getBearerToken(req);

        if (!token) {
            return buildError('로그인이 필요합니다.', 401);
        }

        const body = (await req.json()) as AddCartRequestBody;

        if (!body.productId) {
            return buildError('상품 정보가 없습니다.');
        }

        const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
        const supabasePublicKey =
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabasePublicKey) {
            return buildError('Supabase 공개 키가 설정되지 않았습니다.', 500);
        }

        const userClient = createClient(supabaseUrl, supabasePublicKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        const {
            data: { user },
            error: userError,
        } = await userClient.auth.getUser(token);

        if (userError || !user) {
            return buildError('로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.', 401);
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data: product, error: productError } = await adminClient
            .from('products')
            .select('id')
            .eq('id', body.productId)
            .maybeSingle();

        if (productError) {
            throw new Error(productError.message);
        }

        if (!product) {
            return buildError('상품을 찾을 수 없습니다.', 404);
        }

        const { data: existingCart, error: cartLookupError } = await adminClient
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (cartLookupError) {
            throw new Error(cartLookupError.message);
        }

        let cart = existingCart;

        if (!cart) {
            const { data: newCart, error: cartCreateError } = await adminClient
                .from('carts')
                .insert({ user_id: user.id })
                .select('id')
                .single();

            if (cartCreateError) {
                throw new Error(cartCreateError.message);
            }

            cart = newCart;
        }

        if (!cart?.id) {
            return buildError('장바구니를 생성할 수 없습니다.', 500);
        }

        const cartItemPayload = {
            cart_id: cart.id,
            metadata: body.metadata || {},
            product_id: body.productId,
            quantity: body.quantity ?? 1,
        };

        const { error: cartItemError } = await adminClient
            .from('cart_items')
            .upsert(cartItemPayload as never, { onConflict: 'cart_id,product_id' });

        if (cartItemError) {
            throw new Error(cartItemError.message);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : '장바구니 담기에 실패했습니다.';
        console.error('[CART_ADD] Failed to add item:', error);
        return buildError(message, 500);
    }
}
