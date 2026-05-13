'use client';

import Image from 'next/image';
import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import VoiceInput from '@/components/farmer/VoiceInput';
import styles from './page.module.css';

type AutoSellResult = {
    imageUrls: string[];
    product: {
        category?: string;
        description: string;
        features: string[];
        name: string;
        storageGuide: string;
        title: string;
    };
    promotion: {
        blog: string;
        kakao: string;
    };
};

export default function AutoSellPage() {
    const router = useRouter();
    const [images, setImages] = useState<(File | null)[]>([null, null, null]);
    const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);
    const [voiceText, setVoiceText] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AutoSellResult | null>(null);
    const [farmId, setFarmId] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }

            const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single();

            if (farm) {
                setFarmId(farm.id);
            }
        };

        void checkUser();
    }, [router]);

    const handleImageUpload = (index: number, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const nextImages = [...images];
        nextImages[index] = file;
        setImages(nextImages);

        const nextPreviews = [...imagePreviews];
        nextPreviews[index] = URL.createObjectURL(file);
        setImagePreviews(nextPreviews);
    };

    const handleGenerate = async () => {
        if (!images[0]) {
            alert('최소 1장의 상품 사진을 올려 주세요.');
            return;
        }

        if (!voiceText.trim()) {
            alert('상품 설명을 음성으로 들려주세요.');
            return;
        }

        setLoading(true);

        try {
            const imageUrls: string[] = [];

            for (let index = 0; index < images.length; index += 1) {
                const file = images[index];

                if (!file) {
                    continue;
                }

                const ext = file.name.split('.').pop() || 'jpg';
                const fileName = `${Date.now()}-auto-${index}.${ext}`;
                const filePath = `temp-auto/${fileName}`;
                const { error } = await supabase.storage.from('products').upload(filePath, file);

                if (!error) {
                    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
                    imageUrls.push(data.publicUrl);
                }
            }

            const response = await fetch('/api/ai/auto-seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrls, voiceText }),
            });

            if (!response.ok) {
                throw new Error('AI 상품 생성에 실패했습니다.');
            }

            const data = await response.json() as Omit<AutoSellResult, 'imageUrls'>;
            setAiResult({ ...data, imageUrls });
        } catch (error) {
            console.error(error);
            alert('AI 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSave = async () => {
        if (!farmId || !aiResult) {
            return;
        }

        setLoading(true);

        try {
            const payload = {
                farm_id: farmId,
                name: aiResult.product.name,
                category: aiResult.product.category || 'vegetable',
                description: voiceText,
                image_url: aiResult.imageUrls[0],
                ai_generated_title: aiResult.product.title,
                ai_generated_description: aiResult.product.description,
                ai_generated_storage_guide: aiResult.product.storageGuide,
                ai_generated_features: aiResult.product.features,
                ai_promo_blog: aiResult.promotion.blog,
                ai_promo_kakao: aiResult.promotion.kakao,
                ai_applied: true,
                price_farmer: 0,
                weight_kg: 1,
                stock_quantity: 100,
            };

            const { error } = await supabase.from('products').insert(payload);

            if (error) {
                throw error;
            }

            alert('AI 초안을 저장했고, 바로 판매 준비를 시작할 수 있습니다.');
            router.push('/farmer');
        } catch (error) {
            console.error(error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (aiResult) {
        return (
            <div className={styles.container}>
                <h1 className={styles.title}>완성된 판매 정보 확인</h1>

                <div className={styles.resultSection}>
                    <div className={styles.resultBox}>
                        <h3>자동 생성된 상품 설명</h3>
                        <div className={styles.resultText}>
                            <strong>[ {aiResult.product.title} ]</strong>
                            <br />
                            <br />
                            {aiResult.product.description}
                            <br />
                            <br />
                            <strong>보관 방법:</strong> {aiResult.product.storageGuide}
                        </div>
                    </div>

                    <div className={styles.resultBox}>
                        <h3>카카오톡 홍보 메시지</h3>
                        <div className={styles.resultText}>{aiResult.promotion.kakao}</div>
                    </div>

                    <div className={styles.resultBox}>
                        <h3>네이버 블로그 초안</h3>
                        <div className={styles.resultText}>{aiResult.promotion.blog}</div>
                    </div>

                    <button className={styles.finalSaveBtn} disabled={loading} onClick={() => void handleFinalSave()} type="button">
                        {loading ? '저장 중입니다...' : '이대로 판매 시작하기'}
                    </button>
                    <button
                        onClick={() => setAiResult(null)}
                        style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', color: '#666', marginTop: '16px', cursor: 'pointer' }}
                        type="button"
                    >
                        다시 만들기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>AI 초간편 상품 등록</h1>

            <div className={styles.stepCard}>
                <h2 className={styles.stepTitle}>
                    <span style={{ background: '#10b981', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                    상품 사진을 1장 이상 올려 주세요
                </h2>
                <div className={styles.imageGrid}>
                    {[0, 1, 2].map((index) => (
                        <label key={index} className={styles.imageUploadBox}>
                            {imagePreviews[index] ? (
                                <Image alt="상품 미리보기" className={styles.previewImage} fill sizes="(max-width: 768px) 100vw, 33vw" src={imagePreviews[index]!} unoptimized />
                            ) : (
                                <>
                                    <div className={styles.uploadIcon}>사진</div>
                                    <div className={styles.uploadText}>{index === 0 ? '대표 사진' : '추가 사진'}</div>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(event) => handleImageUpload(index, event)}
                            />
                        </label>
                    ))}
                </div>
            </div>

            <div className={styles.stepCard}>
                <h2 className={styles.stepTitle}>
                    <span style={{ background: '#10b981', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                    어떤 상품인지 편하게 말씀해 주세요
                </h2>
                <VoiceInput onTranscriptComplete={(text) => setVoiceText(text)} />
            </div>

            <button className={styles.submitBtn} disabled={loading} onClick={() => void handleGenerate()} type="button">
                {loading ? 'AI가 판매 문구를 작성하고 있습니다...' : 'AI로 자동 완성하기'}
            </button>
        </div>
    );
}
