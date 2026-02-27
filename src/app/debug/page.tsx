'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getMissingEnvs } from '@/lib/env-check';

export default function DebugPage() {
    const [results, setResults] = useState<any[]>([]);
    const [missingEnvs, setMissingEnvs] = useState<string[]>([]);

    useEffect(() => {
        setMissingEnvs(getMissingEnvs());
    }, []);

    const addResult = (test: string, status: 'SUCCESS' | 'FAILURE', details: any) => {
        setResults(prev => [{ test, status, details, time: new Date().toLocaleTimeString() }, ...prev]);
    };

    const testSupabase = async () => {
        try {
            const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
            if (error) throw error;
            addResult('Supabase Connection', 'SUCCESS', `Connected! Total products: ${data || 0}`);
        } catch (err: any) {
            addResult('Supabase Connection', 'FAILURE', err.message);
        }
    };

    const testFetchProducts = async () => {
        try {
            const { data, error } = await supabase.from('products').select('*').limit(5);
            if (error) throw error;
            addResult('Fetch Products', 'SUCCESS', data);
        } catch (err: any) {
            addResult('Fetch Products', 'FAILURE', err.message);
        }
    };

    const testGemini = async () => {
        if (missingEnvs.includes('GOOGLE_GENERATIVE_AI_API_KEY')) {
            addResult('Gemini Test', 'FAILURE', 'GOOGLE_GENERATIVE_AI_API_KEY is missing. Test skipped.');
            return;
        }
        try {
            const res = await fetch('/api/ai/price-recommendation', {
                method: 'POST',
                body: JSON.stringify({ category: '배추', currentPrice: 10000, harvestDate: '2026-02-15' })
            });
            const data = await res.json();
            if (res.ok) {
                addResult('Gemini Recommendation', 'SUCCESS', data);
            } else {
                throw new Error(data.error || 'Failed to fetch');
            }
        } catch (err: any) {
            addResult('Gemini Recommendation', 'FAILURE', err.message);
        }
    };

    return (
        <div className="fade-in" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
            <div className="container">
                <h1>🛠 Debug & Test Console</h1>
                <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>System status and connectivity tests.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                    {/* Controls */}
                    <div>
                        <div style={{ background: 'var(--accent)', padding: '24px', borderRadius: 'var(--radius)', marginBottom: '24px' }}>
                            <h3 style={{ marginBottom: '16px' }}>환경변수 상태</h3>
                            {missingEnvs.length > 0 ? (
                                <ul style={{ color: '#e63946', fontSize: '0.9rem' }}>
                                    {missingEnvs.map(env => <li key={env}>{env} 누락</li>)}
                                </ul>
                            ) : (
                                <p style={{ color: '#10b981', fontWeight: 600 }}>✅ 모든 필수 키가 설정됨</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn-primary" onClick={testSupabase}>Supabase 연결 테스트</button>
                            <button className="btn-primary" onClick={testFetchProducts}>상품 조회 테스트</button>
                            <button className="btn-primary" onClick={testGemini} disabled={missingEnvs.includes('GOOGLE_GENERATIVE_AI_API_KEY')}>
                                Gemini 테스트 (키 필요)
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => addResult('Cart Test', 'FAILURE', 'Authentication required for cart tests.')}
                            >
                                장바구니 테스트 (Auth 필요)
                            </button>
                        </div>
                    </div>

                    {/* Log */}
                    <div style={{ background: '#1e1e1e', color: '#00ff00', padding: '24px', borderRadius: 'var(--radius)', height: '600px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        <h3 style={{ color: 'white', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>Execution Logs</h3>
                        {results.length === 0 && <p style={{ color: '#666' }}>No tests run yet...</p>}
                        {results.map((r, i) => (
                            <div key={i} style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: '#888' }}>[{r.time}]</span>
                                    <span style={{ fontWeight: 700, color: r.status === 'SUCCESS' ? '#00ff00' : '#ff4444' }}>{r.status}</span>
                                    <span style={{ color: 'white' }}>{r.test}</span>
                                </div>
                                <pre style={{ marginLeft: '16px', marginTop: '4px', whiteSpace: 'pre-wrap', color: '#aaa' }}>
                                    {JSON.stringify(r.details, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
