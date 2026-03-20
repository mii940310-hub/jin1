export function calculateRecommendedPrice(
    baseAvgPrice: number,
    attributes: string[],
    dataConfidence: number
) {
    let multiplier = 1.0;
    const factors: Record<string, number> = {};

    // 슝팜 내부 보정치 로직 (담합을 유도하지 않는 수준의 합리적 가중치)
    if (attributes.includes('special')) {
        multiplier *= 1.08;
        factors['special'] = 1.08;
    }
    if (attributes.includes('eco')) {
        multiplier *= 1.10;
        factors['eco'] = 1.10;
    }
    if (attributes.includes('same_day_harvest')) {
        multiplier *= 1.05;
        factors['same_day_harvest'] = 1.05;
    }
    if (attributes.includes('small_packaging')) {
        multiplier *= 1.07;
        factors['small_packaging'] = 1.07;
    }

    const adjustedPrice = Math.round((baseAvgPrice * multiplier) / 100) * 100;
    const margin = adjustedPrice * 0.05; // 5% 오차범위 (적정가 밴드 형성)

    return {
        recommendedPrice: adjustedPrice,
        minFairPrice: adjustedPrice - margin,
        maxFairPrice: adjustedPrice + margin,
        factors,
        confidenceScore: dataConfidence < 0.5 ? dataConfidence * 0.8 : dataConfidence // 데이터 부족 시 신뢰도 패널티
    };
}

export function evaluatePriceStatus(sellerPrice: number, minFair: number, maxFair: number) {
    if (sellerPrice < minFair) return 'low';
    if (sellerPrice > maxFair) return 'high';
    return 'fair';
}
