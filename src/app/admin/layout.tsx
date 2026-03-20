'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@highlandfresh.com';
            
            if (!user) {
                alert('총괄 관리자 로그인이 필요합니다.');
                router.replace('/login');
                return;
            }

            if (user.email !== adminEmail) {
                alert('총괄 관리자 권한이 없습니다.');
                router.replace('/');
                return;
            }
            
            setLoading(false);
        };
        checkAdmin();
    }, [router]);

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>관리자 권한을 확인하는 중입니다...</div>;

    return <>{children}</>;
}
