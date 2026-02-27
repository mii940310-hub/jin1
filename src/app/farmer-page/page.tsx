'use client';
import { useState, useEffect } from 'react';
import { signIn } from "next-auth/react";

export default function FarmerPage() {
    const [prices, setPrices] = useState([]);

    useEffect(() => {
        fetch('/api/market').then(res => res.json()).then(setPrices);
    }, []);

    return (
        <div className="min-h-screen bg-stone-50 p-6 flex items-center justify-center">
            <div className="w-full max-w-4xl space-y-6">
                {/* 1. 로그인 섹션 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 text-center">
                    <h1 className="text-2xl font-bold mb-6 text-stone-800">농가 서비스 시작하기</h1>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => signIn('kakao')} className="bg-[#FEE500] text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
                            카카오로 1초 시작
                        </button>
                        <button onClick={() => signIn('facebook')} className="bg-[#1877F2] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
                            페이스북으로 시작
                        </button>
                    </div>
                </div>

                {/* 2. 실시간 시세 섹션 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-stone-800">📊 가락시장 실시간 시세</h2>
                        <span className="text-sm text-green-600 font-medium">● 실시간 업데이트 중</span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-stone-100">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 text-stone-500 text-sm">
                                <tr>
                                    <th className="p-4">품목</th>
                                    <th className="p-4">규격</th>
                                    <th className="p-4 text-right">경락가</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-black">
                                {prices.length > 0 ? prices.map((item: any, i) => (
                                    <tr key={i} className="hover:bg-stone-50">
                                        <td className="p-4 font-medium">{item.auclNm || '로딩 중...'}</td>
                                        <td className="p-4 text-stone-500 text-sm">{item.stdUnit || '-'}</td>
                                        <td className="p-4 text-right font-bold text-orange-600">{item.avgPrice ? Number(item.avgPrice).toLocaleString() + '원' : '-'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="p-4 text-center text-stone-500">시세 정보를 불러오는 중입니다...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
