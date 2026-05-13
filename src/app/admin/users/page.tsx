'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type FarmRow = {
    created_at: string;
    id: string;
    name: string;
    owner: { email: string | null; full_name: string | null } | null;
    status?: 'approved' | 'pending' | 'rejected' | string | null;
};

type ProfileRow = {
    created_at: string;
    email: string | null;
    full_name: string | null;
    id: string;
    role: 'admin' | 'consumer' | 'farmer' | string | null;
};

export default function UsersManagementPage() {
    const [farms, setFarms] = useState<FarmRow[]>([]);
    const [profiles, setProfiles] = useState<ProfileRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'farms' | 'users'>('farms');

    const fetchData = async () => {
        setLoading(true);

        const { data: farmsData } = await supabase.from('farms').select('id, name, created_at, status, owner:profiles(full_name, email)');
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email, role, created_at');

        setFarms((farmsData ?? []) as unknown as FarmRow[]);
        setProfiles((profilesData ?? []) as unknown as ProfileRow[]);
        setLoading(false);
    };

    useEffect(() => {
        let active = true;

        const loadInitialData = async () => {
            const { data: farmsData } = await supabase.from('farms').select('id, name, created_at, status, owner:profiles(full_name, email)');
            const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email, role, created_at');

            if (!active) {
                return;
            }

            setFarms((farmsData ?? []) as unknown as FarmRow[]);
            setProfiles((profilesData ?? []) as unknown as ProfileRow[]);
            setLoading(false);
        };

        void loadInitialData();

        return () => {
            active = false;
        };
    }, []);

    const handleFarmStatusChange = async (farmId: string, newStatus: string) => {
        const { error } = await supabase.from('farms').update({ status: newStatus }).eq('id', farmId);

        if (error) {
            alert(`상태 변경 중 오류: ${error.message}`);
            return;
        }

        alert('농가 상태가 변경되었습니다.');
        await fetchData();
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);

        if (error) {
            alert(`권한 변경 중 오류: ${error.message}`);
            return;
        }

        alert('사용자 권한이 변경되었습니다.');
        await fetchData();
    };

    if (loading) {
        return <div style={{ paddingTop: '150px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="fade-in" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem' }}>회원 및 농가 관리</h1>
                </header>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    <button
                        onClick={() => setActiveTab('farms')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: activeTab === 'farms' ? 'var(--primary)' : 'white',
                            color: activeTab === 'farms' ? 'white' : 'var(--foreground)',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        농가 승인 현황
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: activeTab === 'users' ? 'var(--primary)' : 'white',
                            color: activeTab === 'users' ? 'white' : 'var(--foreground)',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        전체 회원 목록
                    </button>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    {activeTab === 'farms' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--accent)', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                    <th style={{ padding: '16px 24px' }}>요청일</th>
                                    <th style={{ padding: '16px 24px' }}>농가명</th>
                                    <th style={{ padding: '16px 24px' }}>요청자</th>
                                    <th style={{ padding: '16px 24px' }}>승인 상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {farms.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '40px', textAlign: 'center' }}>
                                            요청 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    farms.map((farm) => (
                                        <tr key={farm.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '16px 24px', color: 'var(--muted)' }}>{new Date(farm.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '16px 24px', fontWeight: 600 }}>{farm.name}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {farm.owner ? `${farm.owner.full_name || '이름 없음'} (${farm.owner.email || '-'})` : '정보 없음'}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <select
                                                    value={farm.status || 'pending'}
                                                    onChange={(event) => void handleFarmStatusChange(farm.id, event.target.value)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '8px',
                                                        outline: 'none',
                                                        background:
                                                            farm.status === 'approved'
                                                                ? '#dcfce7'
                                                                : farm.status === 'rejected'
                                                                    ? '#fee2e2'
                                                                    : '#fef3c7',
                                                    }}
                                                >
                                                    <option value="pending">대기 중</option>
                                                    <option value="approved">승인 완료</option>
                                                    <option value="rejected">반려됨</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'users' && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--accent)', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                    <th style={{ padding: '16px 24px' }}>가입일</th>
                                    <th style={{ padding: '16px 24px' }}>이름</th>
                                    <th style={{ padding: '16px 24px' }}>이메일</th>
                                    <th style={{ padding: '16px 24px' }}>권한</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.map((profile) => (
                                    <tr key={profile.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px 24px', color: 'var(--muted)' }}>{new Date(profile.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>{profile.full_name || '-'}</td>
                                        <td style={{ padding: '16px 24px' }}>{profile.email || '-'}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <select
                                                value={profile.role || 'consumer'}
                                                onChange={(event) => void handleRoleChange(profile.id, event.target.value)}
                                                style={{
                                                    padding: '8px 12px',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    outline: 'none',
                                                    background: profile.role === 'admin' ? '#fdf2f8' : 'white',
                                                }}
                                            >
                                                <option value="consumer">소비자</option>
                                                <option value="farmer">농가</option>
                                                <option value="admin">관리자</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
