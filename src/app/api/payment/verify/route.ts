import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type VerifyRequestBody = {
  amount?: number;
  items?: Array<{
    quantity?: number;
    metadata?: {
      ai_discount?: number;
      selected_option_index?: number;
      weight_type?: "fixed" | "range" | "variable";
    } | null;
    products?: {
      id: string;
      price_logistics?: number | null;
      price_per_kg?: number | null;
      price_total: number;
      weight_options?: Array<{ weight: number }> | null;
      weight_type?: "fixed" | "range" | "variable" | null;
      min_weight?: number | null;
      max_weight?: number | null;
    };
  }>;
  orderId?: string;
  paymentId?: string;
  shippingAddress?: string;
  userId?: string;
};

function buildError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    return {
      error: buildError("서버 설정 오류: NEXT_PUBLIC_SUPABASE_URL이 없습니다.", 500),
    };
  }

  if (!serviceRoleKey) {
    return {
      error: buildError(
        "서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY가 없습니다. 주문 저장을 위해 필요합니다.",
        500,
      ),
    };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey),
  };
}

function calculateItemPricing(item: NonNullable<VerifyRequestBody["items"]>[number]) {
  const product = item.products;
  const metadata = item.metadata || {};

  if (!product) {
    throw new Error("주문 상품 정보가 누락되었습니다.");
  }

  const weightType = metadata.weight_type || product.weight_type || "fixed";

  let finalPrice = 0;
  let unitPrice = product.price_total;

  if (weightType === "fixed") {
    finalPrice = product.price_total;
  } else if (weightType === "range") {
    const optionIndex = metadata.selected_option_index ?? 0;
    const option = product.weight_options?.[optionIndex] || { weight: 1 };
    const baseWeight = product.weight_options?.[0]?.weight || 1;
    finalPrice = Math.round(product.price_total * (option.weight / baseWeight));
    unitPrice = finalPrice;
  } else {
    const minWeight = product.min_weight ?? 0;
    const maxWeight = product.max_weight ?? 0;
    const pricePerKg = product.price_per_kg ?? 0;
    const avgWeight = (minWeight + maxWeight) / 2;
    const farmPrice = Math.round(avgWeight * pricePerKg);
    finalPrice = farmPrice + Math.round(farmPrice * 0.1) + (product.price_logistics || 3000);
    unitPrice = pricePerKg;
  }

  finalPrice = Math.max(0, finalPrice - (metadata.ai_discount || 0));

  return {
    finalPrice,
    productId: product.id,
    quantity: item.quantity ?? 1,
    unitPrice,
  };
}

function toUserMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("row-level security policy")) {
    return "주문 저장이 Supabase 권한 설정(RLS)에 의해 차단되었습니다. SUPABASE_SERVICE_ROLE_KEY를 .env.local에 추가해야 합니다.";
  }

  return `서버 에러: ${message}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerifyRequestBody;
    const { amount, items, paymentId, shippingAddress, userId } = body;

    console.log("[VERIFY] Request received:", {
      amount,
      hasItems: Array.isArray(items),
      itemsCount: items?.length ?? 0,
      paymentId,
      userId,
    });

    if (!paymentId || !amount || !userId || !items?.length) {
      return buildError("잘못된 요청입니다. 결제 검증에 필요한 값이 누락되었습니다.");
    }

    const portoneApiSecret = process.env.PORTONE_API_SECRET;
    if (!portoneApiSecret) {
      return buildError("서버 설정 오류: PORTONE_API_SECRET이 없습니다.", 500);
    }

    const portoneUrl = `https://api.portone.io/payments/${paymentId}`;
    const paymentResponse = await fetch(portoneUrl, {
      method: "GET",
      headers: {
        Authorization: `PortOne ${portoneApiSecret}`,
      },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("[VERIFY] PortOne payment lookup failed:", paymentResponse.status, errorText);
      return buildError(`결제 정보 조회 실패 (${paymentResponse.status}): ${errorText}`);
    }

    const paymentData = await paymentResponse.json();
    console.log("[VERIFY] PortOne payment status:", paymentData.status);

    if (paymentData.status !== "PAID") {
      return buildError(`결제가 승인되지 않았습니다. (status: ${paymentData.status})`);
    }

    if (paymentData.amount?.total !== amount) {
      return buildError(
        `결제 금액이 일치하지 않습니다. (포트원:${paymentData.amount?.total} / 요청:${amount})`,
      );
    }

    const { client: supabase, error } = getServerSupabaseClient();
    if (error) {
      return error;
    }

    const { data: orderHeader, error: orderError } = await supabase
      .from("orders")
      .insert({
        payment_id: paymentId,
        shipping_address: shippingAddress || "배송지 정보 없음",
        status: "paid",
        total_amount: amount,
        user_id: userId,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(orderError.message);
    }

    const orderItemsData = items.map((item) => {
      const pricing = calculateItemPricing(item);

      return {
        metadata: item.metadata || {},
        order_id: orderHeader.id,
        product_id: pricing.productId,
        quantity: pricing.quantity,
        total_price: pricing.finalPrice,
        unit_price: pricing.unitPrice,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData);
    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cartError) {
      throw new Error(cartError.message);
    }

    if (cart) {
      const { error: clearCartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cart.id);

      if (clearCartError) {
        throw new Error(clearCartError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "결제 검증 및 주문 처리가 완료되었습니다.",
      orderId: orderHeader.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return buildError(toUserMessage(error), 500);
  }
}
