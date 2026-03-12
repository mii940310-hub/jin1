import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { paymentId, orderId, amount, items, userId, shippingAddress } = await req.json();

    if (!paymentId || !amount || !userId) {
      return NextResponse.json({ success: false, message: 'Bad request: missing parameters' }, { status: 400 });
    }

    // 1. 포트원 결제 검증 (V2 API)
    // 포트원 시크릿 키는 절대 클라이언트에 노출되면 안 되므로 .env에 저장해서 서버에서만 사용
    const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
    
    // 포트원 V2 결제건 단건 조회 API
    const paymentResponse = await fetch(`https://api.portone.io/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `PortOne ${PORTONE_API_SECRET}`,
      },
    });

    if (!paymentResponse.ok) {
        console.error("Payment verification request failed:", await paymentResponse.text());
        return NextResponse.json({ success: false, message: '결제 정보 조회 실패' }, { status: 400 });
    }

    const paymentData = await paymentResponse.json();

    // 2. 결제 상태 및 금액 검증
    // 포트원 V2의 결제 상태는 status (PAID 등)
    if (paymentData.status !== "PAID") {
      return NextResponse.json({ success: false, message: '결제가 승인되지 않았습니다.' }, { status: 400 });
    }

    // 결제된 금액(paymentData.amount.total)과 클라이언트에서 요청한 금액(amount) 비교
    // (보안을 위해 실제로는 DB의 장바구니/상품 가격을 한 번 더 계산해서 비교하는 것이 가장 안전합니다)
    if (paymentData.amount.total !== amount) {
      return NextResponse.json({ success: false, message: '결제 금액이 위변조되었습니다.' }, { status: 400 });
    }

    // 3. 주문 정보를 Supabase DB에 저장
    const { data: orderHeader, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: amount,
        status: 'paid', // 결제 완료 상태
        shipping_address: shippingAddress || '배송지 정보 없음', // 추가 개발 필요
        payment_id: paymentId,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. 주문 상세 상품(Order Items) 데이터를 배열 형태로 준비해서 삽입
    const orderItemsData = items.map((item: any) => ({
      order_id: orderHeader.id,
      product_id: item.products.id,
      quantity: item.quantity,
      unit_price: item.products.price_total,
      total_price: item.products.price_total * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) throw itemsError;

    // 5. 장바구니 비우기
    // 해당 사용자의 장바구니를 찾아 장바구니 안의 아이템들을 삭제합니다.
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cart) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
    }

    // 모든 과정 완료
    return NextResponse.json({ success: true, message: '결제 검증 및 주문 처리가 완료되었습니다.', orderId: orderHeader.id });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, message: '서버 에러: ' + error.message }, { status: 500 });
  }
}
