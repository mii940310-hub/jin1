import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateRecommendedPrice, evaluatePriceStatus } from '@/lib/pricing-engine';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId } = body;

        console.log(`[API_START] Recalculating price for productId: ${productId}`);

        if (!productId) {
            console.error('[API_ERROR] productId is required');
            return NextResponse.json({ error: 'productId is required' }, { status: 400 });
        }

        // Fetch product
        const { data: product, error: prodError } = await supabase.from('products').select('*').eq('id', productId).single();
        if (prodError || !product) {
            console.error('[API_ERROR] Product not found:', prodError?.message);
            return NextResponse.json({ error: `Product not found: ${prodError?.message}` }, { status: 404 });
        }

        const query = product.name || '';
        const weight = product.weight_type === 'fixed' ? product.weight_kg : (product.min_weight + product.max_weight)/2 || 1;
        const unit = product.weight_unit || 'kg';
        const sellerPrice = product.price_total || 0;

        let baseMarketPrice = 0;
        let confidenceScore = 1.0;

        // Try getting market sources
        const { data: sources, error } = await supabase
            .from('market_price_sources')
            .select('*')
            .ilike('mapped_name', `%${query.split(' ').pop() || query}%`)
            .order('recorded_date', { ascending: false });

        if (error || !sources || sources.length === 0) {
            console.log(`[API_INFO] DB Missing/No data for ${query}. Using Fallback Strategy based on sellerPrice.`);
            
            // Fallback logic exactly as specified
            const sellerPriceCalc = sellerPrice || 10000;
            // Introduce a standard 10% offset to establish a baseline average from current price
            baseMarketPrice = sellerPriceCalc * 0.95; 
            confidenceScore = 0.8;
        } else {
            console.log(`[API_INFO] Found ${sources.length} market sources. Average calculation starting.`);
            const todaySources = sources.slice(0, 4);
            const sum = todaySources.reduce((acc: number, cur: any) => acc + (cur.price / cur.weight), 0);
            baseMarketPrice = sum / todaySources.length;
            
            let weightMultiplier = Number(weight) || 1;
            if (unit === 'g') weightMultiplier = weightMultiplier / 1000;
            else if (unit === 'box') weightMultiplier = weightMultiplier * 10;
            
            baseMarketPrice = Math.round(baseMarketPrice * weightMultiplier);
            confidenceScore = 0.95; 
        }

        // Use pricing-engine logic
        const { recommendedPrice, minFairPrice, maxFairPrice, confidenceScore: finalConfidence } = calculateRecommendedPrice(baseMarketPrice, [], confidenceScore);

        const priceStatus = evaluatePriceStatus(sellerPrice, minFairPrice, maxFairPrice);

        const newRec = {
            product_id: productId,
            base_market_price: baseMarketPrice,
            adjusted_recommended_price: recommendedPrice,
            min_fair_price: minFairPrice,
            max_fair_price: maxFairPrice,
            confidence_score: finalConfidence,
            price_status: priceStatus,
            calculated_at: new Date().toISOString()
        };

        // Attempt DB update, but ignoring failures gracefully in case schema holds back
        if (product.id) {
            // Using a simple upsert based on product_id if set as constraint, otherwise doing a delete then insert
            const { error: delError } = await supabase.from('price_recommendations').delete().eq('product_id', productId);
            if (!delError) {
                const { error: insError } = await supabase.from('price_recommendations').insert(newRec);
                if (insError) console.warn('[API_WARN] DB Insert failed for recommendations:', insError.message);
                else console.log('[API_SUCCESS] DB Update OK');
            } else {
                console.warn('[API_WARN] DB Delete failed, fallback calculating dynamically');
            }
        }

        console.log(`[API_END] Recalculation done for ${productId}`);

        return NextResponse.json({
            recommendedPrice,
            minAllowedPrice: minFairPrice,
            maxAllowedPrice: maxFairPrice,
            status: priceStatus,
            confidence: finalConfidence,
            calculatedAt: newRec.calculated_at
        });

    } catch (e: any) {
        console.error("[API_FATAL] Server exception occurred: ", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
