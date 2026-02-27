'use client';
import { useState } from 'react';

export default function ShoppingDashboard() {
    const [query, setQuery] = useState('');
    const [naverResults, setNaverResults] = useState([]);
    const [emartUrl, setEmartUrl] = useState('');
    const [emartData, setEmartData] = useState<any>(null);
    const [loading, setLoading] = useState({ naver: false, emart: false });

    // 1. 네이버 최저가 검색
    const searchNaver = async () => {
        setLoading(prev => ({ ...prev, naver: true }));
        try {
            const res = await fetch(`/api/shopping/naver?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            setNaverResults(data);
        } catch (error) {
            console.error("네이버 검색 실패:", error);
        }
        setLoading(prev => ({ ...prev, naver: false }));
    };

    // 2. 이마트/G마켓 실시간 가격 확인
    const fetchEmart = async () => {
        setLoading(prev => ({ ...prev, emart: true }));
        try {
            const res = await fetch(`/api/shopping/emart?url=${encodeURIComponent(emartUrl)}`);
            const data = await res.json();
            setEmartData(data);
            alert(`${data.message} (데이터 길이: ${data.length}자)`);
        } catch (error) {
            alert("이마트 데이터를 가져오는데 실패했습니다.");
        }
        setLoading(prev => ({ ...prev, emart: false }));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <header className="max-w-6xl mx-auto mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">🛒 SMART PRICE TRACKER</h1>
                <p className="text-gray-600">네이버, 쿠팡, 이마트 가격을 한곳에서 관리하세요.</p>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 왼쪽: 네이버 실시간 최저가 검색 */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-800">네이버 쇼핑 최저가</h2>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchNaver()}
                            placeholder="상품명을 입력하세요"
                            className="flex-1 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-black"
                        />
                        <button
                            onClick={searchNaver}
                            disabled={loading.naver}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {loading.naver ? '검색 중...' : '검색'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {naverResults.map((item: any) => (
                            <div key={item.productId} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800 line-clamp-1" dangerouslySetInnerHTML={{ __html: item.title }} />
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-red-500 font-bold text-lg">{Number(item.lprice).toLocaleString()}원</span>
                                        <span className="text-xs text-gray-400">| {item.mallName}</span>
                                    </div>
                                </div>
                                <a href={item.link} target="_blank" className="ml-4 text-xs font-bold text-blue-600 border border-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all">이동</a>
                            </div>
                        ))}
                        {naverResults.length === 0 && !loading.naver && <p className="text-center text-gray-400 py-10">검색 결과가 없습니다.</p>}
                    </div>
                </section>

                {/* 오른쪽: 이마트/G마켓 & 쿠팡 관리 */}
                <section className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-6 bg-yellow-400 rounded-full"></div>
                            <h2 className="text-xl font-bold text-gray-800">이마트 / G마켓 연동</h2>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={emartUrl}
                                onChange={(e) => setEmartUrl(e.target.value)}
                                placeholder="상품 상세페이지 URL을 붙여넣으세요"
                                className="w-full border border-gray-300 p-3 rounded-xl outline-none text-black text-sm"
                            />
                            <button
                                onClick={fetchEmart}
                                disabled={loading.emart}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {loading.emart ? '데이터 분석 중...' : '실시간 정보 가져오기'}
                            </button>
                            {emartData && (
                                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <p className="text-sm text-yellow-800 font-medium">✅ 연결 성공: {emartData.length}바이트의 데이터를 읽어왔습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 쿠팡 안내 박스 */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="text-blue-800 font-bold mb-2">💡 쿠팡 파트너스 API 안내</h3>
                        <p className="text-sm text-blue-600 leading-relaxed">
                            쿠팡 API는 최종 승인(누적 판매액 발생) 후 활성화됩니다. 승인 전까지는 수동으로 가격을 관리하거나, 네이버 검색결과의 쿠팡 가격을 참고하세요!
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
