import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// 일반 anon 키 대신 서버 전용 service role 키를 사용하여 RLS(보안 규칙) 우회
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, orderId, amount, items, userId, shippingAddress } = body;

    console.log('[VERIFY] Step 1 - 수신 파라미터:', { paymentId, amount, userId, itemsCount: items?.length });

    if (!paymentId || !amount || !userId) {
      console.error('[VERIFY] 필수 파라미터 누락:', { paymentId: !!paymentId, amount: !!amount, userId: !!userId });
      return NextResponse.json({ success: false, message: 'Bad request: missing parameters' }, { status: 400 });
    }

    // 1. 포트원 결제 검증 (V2 API)
    const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
    console.log('[VERIFY] Step 2 - API Secret 존재 여부:', !!PORTONE_API_SECRET, '| 앞 20자:', PORTONE_API_SECRET?.slice(0, 20));
    
    // 포트원 V2 결제건 단건 조회 API
    const portoneUrl = `https://api.portone.io/payments/${paymentId}`;
    console.log('[VERIFY] Step 3 - 포트원 API 호출:', portoneUrl);
    const paymentResponse = await fetch(portoneUrl, {
      method: "GET",
      headers: {
        "Authorization": `PortOne ${PORTONE_API_SECRET}`,
      },
    });

    if (!paymentResponse.ok) {
        const errText = await paymentResponse.text();
        console.error('[VERIFY] 포트원 API 응답 실패:', paymentResponse.status, errText);
        return NextResponse.json({ success: false, message: `결제 정보 조회 실패 (${paymentResponse.status}): ${errText}` }, { status: 400 });
    }

    const paymentData = await paymentResponse.json();
    console.log('[VERIFY] Step 4 - 포트원 응답 status:', paymentData.status, '| 금액:', paymentData.amount?.total, '| 요청금액:', amount);

    // 2. 결제 상태 검증
    if (paymentData.status !== "PAID") {
      console.error('[VERIFY] 결제 미승인 상태:', paymentData.status);
      return NextResponse.json({ success: false, message: `결제가 승인되지 않았습니다. (status: ${paymentData.status})` }, { status: 400 });
    }

    // 3. 금액 위변조 검증
    if (paymentData.amount.total !== amount) {
      console.error('[VERIFY] 금액 불일치:', { portone: paymentData.amount.total, requested: amount });
      return NextResponse.json({ success: false, message: `결제 금액이 일치하지 않습니다. (포트원:${paymentData.amount.total} / 요청:${amount})` }, { status: 400 });
    }
    
    console.log('[VERIFY] Step 5 - 검증 완료, DB 저장 진행');

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
    const orderItemsData = items.map((item: any) => {
      const product = item.products;
      const meta = item.metadata || {};
      const weightType = meta.weight_type || product.weight_type || 'fixed';
      
      let finalPrice = 0;
      let unitPrice = product.price_total;

      if (weightType === 'fixed') {
          finalPrice = product.price_total;
      } else if (weightType === 'range') {
          const optIndex = meta.selected_option_index ?? 0;
          const opt = product.weight_options?.[optIndex] || { weight: 1 };
          const baseWeight = product.weight_options?.[0]?.weight || 1;
          finalPrice = Math.round(product.price_total * (opt.weight / baseWeight));
          unitPrice = finalPrice;
      } else if (weightType === 'variable') {
          const avgW = (product.min_weight + product.max_weight) / 2;
          const farmPrice = Math.round(avgW * product.price_per_kg);
          finalPrice = farmPrice + Math.round(farmPrice * 0.1) + (product.price_logistics || 3000);
          unitPrice = product.price_per_kg; // For variable, unit price is per kg
      }

      const aiDiscount = meta.ai_discount || 0;
      finalPrice = Math.max(0, finalPrice - aiDiscount);

      return {
        order_id: orderHeader.id,
        product_id: item.products.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: finalPrice,
        metadata: meta
      };
    });

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
