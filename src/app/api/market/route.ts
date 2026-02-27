import { NextResponse } from 'next/server';

export async function GET() {
    const key = process.env.DATA_GO_KR_API_KEY;
    // 가락시장(110001) 경락정보 예시 URL
    const url = `http://apis.data.go.kr/B552895/dr_pbl_info_opn/get_dr_pbl_info_opn?serviceKey=${key}&pageNo=1&numOfRows=5&type=json`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        return NextResponse.json(data.response.body.items.item);
    } catch (e) {
        return NextResponse.json([{ name: "데이터 로딩 실패", price: "-" }]);
    }
}
