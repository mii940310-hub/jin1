import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'], // 관리자 및 API 폴더는 검색엔진 노출 방지
        },
        sitemap: 'https://www.shoongfarm.com/sitemap.xml',
    };
}
