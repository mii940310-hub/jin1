import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateRecommendedPrice, evaluatePriceStatus } from '@/lib/pricing-engine';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { query, weight = 1, unit = 'kg', attributes = [], sellerPrice } = body;

        let baseMarketPrice = 0;
        let confidenceScore = 1.0;

        // Try querying the market_price_sources table. If it errors out (meaning SQL not run yet), use fallback dummy data
        const { data: sources, error } = await supabase
            .from('market_price_sources')
            .select('*')
            .ilike('mapped_name', `%${query.split(' ').pop() || query}%`) // Simple match by last word
            .order('recorded_date', { ascending: false });

        if (error || !sources || sources.length === 0) {
            // Fallback strategy / Dummy data when DB table isn't ready or no data found
            console.log('Using fallback dummy data or no data found', error);
            
            // Generate some plausible dummy base price based on query length/content
            if (query.includes('옥수수')) baseMarketPrice = 3200;
            else if (query.includes('배추')) baseMarketPrice = 4500;
            else if (query.includes('감자')) baseMarketPrice = 2800;
            else baseMarketPrice = 5000;

            confidenceScore = 0.6; // lower confidence because we fell back to hardcoded/dummy
        } else {
            // Calculate true average from queried recent sources
            const todaySources = sources.slice(0, 4); // Take latest 4
            const sum = todaySources.reduce((acc: number, cur: any) => acc + (cur.price / cur.weight), 0);
            baseMarketPrice = sum / todaySources.length;
            confidenceScore = 0.95; 
        }

        // Adjust for the requested weight unit (Assuming DB base is 1kg)
        let weightMultiplier = Number(weight) || 1;
        if (unit === 'g') weightMultiplier = weightMultiplier / 1000;
        else if (unit === 'box') weightMultiplier = weightMultiplier * 10;
        
        const finalBase = Math.round(baseMarketPrice * weightMultiplier);

        const { recommendedPrice, minFairPrice, maxFairPrice, factors, confidenceScore: finalConfidence } = calculateRecommendedPrice(finalBase, attributes, confidenceScore);

        let priceStatus = 'unknown';
        if (sellerPrice !== undefined && sellerPrice !== null) {
            priceStatus = evaluatePriceStatus(sellerPrice, minFairPrice, maxFairPrice);
        }

        return NextResponse.json({
            baseMarketPrice: finalBase,
            recommendedPrice,
            minFairPrice,
            maxFairPrice,
            priceStatus,
            factors,
            confidenceScore: finalConfidence
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
