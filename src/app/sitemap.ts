import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

// 동적 사이트맵 생성
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.shoongfarm.com';

    // 기본 정적 경로 목록
    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        }
    ];

    try {
        // 실제 상품 데이터베이스를 불러와 검색엔진에 동적으로 제출
        const { data: products } = await supabase.from('products').select('id, updated_at');
        
        if (products) {
            const productRoutes = products.map((product) => ({
                url: `${baseUrl}/products/${product.id}`,
                lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
            
            return [...routes, ...productRoutes];
        }
    } catch (e) {
        console.error("Sitemap generation error:", e);
    }

    return routes;
}
