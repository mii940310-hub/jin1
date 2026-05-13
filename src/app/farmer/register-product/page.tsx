'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Check, MessageCircleMore, Mic, Sparkles, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SpeechRecognitionConstructor = new () => SpeechRecognition;
type UploadedImage = { dataUrl: string; file: File };
type DraftFaq = { question: string; answer: string };
type ProductDraft = {
    category: 'grain' | 'vegetable';
    productName: string;
    summary: string;
    description: string;
    harvestDate: string;
    harvestDateLabel: string;
    storageGuide: string;
    shippingGuide: string;
    keywords: string[];
    naverBlogPost: string;
    kakaoPromoMessage: string;
    snsImageHeadline: string;
    snsCaption: string;
    faq: DraftFaq[];
    suggestedPrice: number;
    logisticsFee: number;
    platformFee: number;
    farmerRevenue: number;
    recommendedStock: number;
    caution: string;
};

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
    interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onend: (() => void) | null;
        onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        start: () => void;
        stop: () => void;
    }
    interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList }
    interface SpeechRecognitionErrorEvent extends Event { error: string }
    interface SpeechRecognitionResultList { readonly length: number; [index: number]: SpeechRecognitionResult }
    interface SpeechRecognitionResult { readonly isFinal: boolean; readonly length: number; [index: number]: SpeechRecognitionAlternative }
    interface SpeechRecognitionAlternative { readonly confidence: number; readonly transcript: string }
}

const emptySlots = [null, null, null] as Array<UploadedImage | null>;
const cardStyle: CSSProperties = { background: 'white', border: '1px solid #dbe7d8', borderRadius: 28, padding: 24 };
const inputStyle: CSSProperties = { width: '100%', borderRadius: 18, border: '2px solid #d5dfd2', padding: '16px 18px', fontSize: '1rem', lineHeight: 1.6, background: '#fffef9' };
const buttonStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 22px', borderRadius: 999, background: '#28543a', color: 'white', fontWeight: 800 };

function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
        reader.readAsDataURL(file);
    });
}

function normalizeDraft(raw: Partial<ProductDraft>): ProductDraft {
    const suggestedPrice = Number(raw.suggestedPrice) || 18000;
    const logisticsFee = Number(raw.logisticsFee) || 3000;
    const platformFee = Number(raw.platformFee) || Math.round(suggestedPrice * 0.1);
    return {
        category: raw.category === 'grain' ? 'grain' : 'vegetable',
        productName: raw.productName || '산지 직송 농산물',
        summary: raw.summary || '사진과 메모를 바탕으로 상품 소개를 자동 생성했습니다.',
        description: raw.description || '',
        harvestDate: raw.harvestDate || new Date().toISOString().slice(0, 10),
        harvestDateLabel: raw.harvestDateLabel || '수확 후 순차 발송',
        storageGuide: raw.storageGuide || '받으신 뒤에는 냉장 보관을 권장합니다.',
        shippingGuide: raw.shippingGuide || '주문 순서대로 정성껏 포장해 발송합니다.',
        keywords: Array.isArray(raw.keywords) ? raw.keywords.slice(0, 8) : [],
        naverBlogPost: raw.naverBlogPost || '',
        kakaoPromoMessage: raw.kakaoPromoMessage || '',
        snsImageHeadline: raw.snsImageHeadline || raw.productName || '오늘 수확한 신선함',
        snsCaption: raw.snsCaption || '',
        faq: Array.isArray(raw.faq) ? raw.faq.slice(0, 3) : [],
        suggestedPrice,
        logisticsFee,
        platformFee,
        farmerRevenue: Number(raw.farmerRevenue) || Math.max(0, suggestedPrice - logisticsFee - platformFee),
        recommendedStock: Number(raw.recommendedStock) || 20,
        caution: raw.caution || '농산물 특성상 크기와 모양은 조금씩 다를 수 있습니다.',
    };
}

export default function RegisterProductPage() {
    const router = useRouter();
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const [farmId, setFarmId] = useState<string | null>(null);
    const [farmName, setFarmName] = useState('');
    const [images, setImages] = useState<Array<UploadedImage | null>>(emptySlots);
    const [farmerNotes, setFarmerNotes] = useState('');
    const [draft, setDraft] = useState<ProductDraft | null>(null);
    const [manualPrice, setManualPrice] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const speechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    const readyImages = useMemo(() => images.filter((image): image is UploadedImage => Boolean(image)), [images]);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('로그인이 필요합니다.');
                router.push('/login');
                return;
            }
            const { data: farm } = await supabase.from('farms').select('id, name').eq('owner_id', user.id).single();
            if (!farm) {
                alert('먼저 농가 정보를 등록해 주세요.');
                router.push('/farmer/register');
                return;
            }
            setFarmId(farm.id);
            setFarmName(farm.name);
        };
        void init();
    }, [router]);

    useEffect(() => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return;
        const recognition = new Recognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0]?.transcript || '').join(' ').trim();
            if (transcript) setFarmerNotes((previous) => (previous.trim() ? `${previous.trim()}\n${transcript}` : transcript));
            setSpeechError('');
        };
        recognition.onerror = (event) => {
            setSpeechError(event.error === 'not-allowed' ? '마이크 권한을 허용해 주세요.' : '음성 입력을 처리하지 못했습니다.');
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        return () => { recognition.stop(); recognitionRef.current = null; };
    }, []);

    const onSelectImage = async (index: number, files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('사진 파일만 올릴 수 있습니다.');
            return;
        }
        const dataUrl = await readFileAsDataUrl(file);
        setImages((previous) => {
            const next = [...previous];
            next[index] = { file, dataUrl };
            return next;
        });
    };

    const onToggleVoice = () => {
        if (!recognitionRef.current) {
            setSpeechError('이 브라우저에서는 음성 입력을 지원하지 않습니다.');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }
        setSpeechError('');
        setIsListening(true);
        recognitionRef.current.start();
    };

    const onGenerate = async () => {
        if (readyImages.length !== 3) {
            alert('사진 3장을 모두 올려 주세요.');
            return;
        }
        setIsGenerating(true);
        setStatusMessage('AI가 판매 문구를 만들고 있습니다.');
        try {
            const response = await fetch('/api/ai/seller-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farmerNotes, imageDataUrls: readyImages.map((image) => image.dataUrl) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'AI 생성에 실패했습니다.');
            const nextDraft = normalizeDraft(data);
            setDraft(nextDraft);
            setManualPrice(String(nextDraft.suggestedPrice));
            setStatusMessage('자동 작성이 완료되었습니다. 내용을 확인한 뒤 판매를 시작하세요.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'AI 생성에 실패했습니다.';
            setStatusMessage(message);
            alert(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit = async () => {
        if (!farmId || !draft) {
            alert('먼저 자동 작성을 완료해 주세요.');
            return;
        }
        if (readyImages.length !== 3) {
            alert('사진 3장을 모두 올려 주세요.');
            return;
        }
        setIsSubmitting(true);
        try {
            const fileName = `${farmId}/${Date.now()}-product-main.jpg`;
            const firstImage = readyImages[0];
            const base64 = firstImage.dataUrl.split(',')[1];
            const binary = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
            const blob = new Blob([binary], { type: firstImage.file.type || 'image/jpeg' });
            const { error: uploadError } = await supabase.storage.from('products').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
            if (uploadError) throw new Error(uploadError.message);
            const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
            const priceTotal = manualPrice ? Number(manualPrice) : draft.suggestedPrice;
            const priceFee = Math.round(priceTotal * 0.1);
            const priceLogistics = draft.logisticsFee || 3000;
            const description = [
                draft.summary,
                '',
                draft.description,
                '',
                `[수확 안내] ${draft.harvestDateLabel}`,
                `[보관법] ${draft.storageGuide}`,
                `[배송 안내] ${draft.shippingGuide}`,
                `[키워드] ${draft.keywords.join(', ')}`,
                `[안내] ${draft.caution}`,
                farmerNotes ? `[농가 메모] ${farmerNotes}` : '',
            ].filter(Boolean).join('\n');

            const { error } = await supabase.from('products').insert({
                category: draft.category,
                description,
                farm_id: farmId,
                harvest_date: draft.harvestDate,
                image_url: publicUrlData.publicUrl,
                name: draft.productName,
                price_farmer: Math.max(0, priceTotal - priceFee - priceLogistics),
                price_fee: priceFee,
                price_logistics: priceLogistics,
                price_total: priceTotal,
                stock_quantity: draft.recommendedStock || 20,
            });
            if (error) throw new Error(error.message);
            alert('상품 등록이 완료되었습니다.');
            router.push('/farmer');
        } catch (error) {
            alert(error instanceof Error ? error.message : '상품 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fade-in" style={{ background: 'linear-gradient(180deg, #f7f2e8 0%, #f8faf5 55%, #eef6f0 100%)', minHeight: '100vh', padding: '104px 0 80px' }}>
            <div className="container" style={{ maxWidth: 1080 }}>
                <section style={{ background: 'rgba(255,255,255,.92)', borderRadius: 32, boxShadow: '0 24px 80px rgba(28,55,37,.08)', overflow: 'hidden' }}>
                    <div style={{ padding: '40px 32px 28px', background: 'linear-gradient(135deg, rgba(27,70,47,.98) 0%, rgba(58,112,72,.95) 100%)', color: 'white' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,.12)', fontWeight: 700, marginBottom: 18 }}><Sparkles size={20} />사진 3장과 메모로 자동 판매 등록</div>
                        <h1 style={{ fontSize: '3rem', lineHeight: 1.12, marginBottom: 14, fontWeight: 800 }}>복잡한 입력 없이<br />상품 판매를 바로 시작하세요</h1>
                        <p style={{ fontSize: '1.2rem', lineHeight: 1.6, maxWidth: 760 }}>{farmName ? `${farmName} 상품 등록 화면입니다.` : '농가 상품 등록 화면입니다.'} 사진 3장과 설명만 있으면 상품명, 상세 설명, 보관법, 홍보 문구까지 자동으로 준비됩니다.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '18px' }}>
                            <Link
                                href="/farmer/auto-sell"
                                style={{
                                    background: 'rgba(255,255,255,.16)',
                                    border: '1px solid rgba(255,255,255,.28)',
                                    borderRadius: '999px',
                                    color: 'white',
                                    fontWeight: 700,
                                    padding: '12px 18px',
                                }}
                            >
                                음성과 사진만으로 바로 등록하기
                            </Link>
                            <div style={{ alignSelf: 'center', color: 'rgba(255,255,255,.86)', fontSize: '.95rem' }}>
                                더 빠르게 올리고 싶다면 초간편 모드가 더 잘 맞습니다.
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: 32, display: 'grid', gap: 20 }}>
                        <div style={{ ...cardStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                            {[
                                ['1', '사진 3장 올리기', '대표 사진, 가까운 사진, 포장 사진을 올리면 더 정확합니다.'],
                                ['2', '말로 설명하기', '맛, 수확 상태, 보관법을 편하게 말씀해 주세요.'],
                                ['3', '자동 작성 후 판매', '홍보 문구와 FAQ까지 자동으로 준비됩니다.'],
                            ].map(([step, title, description]) => (
                                <div key={step} style={{ background: '#fbfcf7', border: '1px solid #dbe7d8', borderRadius: 22, padding: 20 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#163824', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 12 }}>{step}</div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 8, color: '#163824' }}>{title}</div>
                                    <div style={{ color: '#47624e', lineHeight: 1.6 }}>{description}</div>
                                </div>
                            ))}
                        </div>

                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#47624e', marginBottom: 18 }}><Upload size={18} />사진 칸을 눌러 순서대로 올려 주세요</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                {images.map((image, index) => (
                                    <label key={index} style={{ minHeight: 240, borderRadius: 24, border: '2px dashed #b8caaf', background: '#fffef8', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {image ? <NextImage alt={`상품 사진 ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 33vw" src={image.dataUrl} style={{ objectFit: 'cover' }} unoptimized /> : <div style={{ textAlign: 'center', color: '#47624e', padding: 20 }}><div style={{ fontSize: '2rem', marginBottom: 8 }}>{index + 1}</div><div style={{ fontWeight: 700 }}>{index === 0 ? '대표 사진' : index === 1 ? '가까운 사진' : '포장 사진'}</div></div>}
                                        <input type="file" accept="image/*" onChange={(event) => void onSelectImage(index, event.target.files)} style={{ display: 'none' }} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#47624e', marginBottom: 18 }}><Mic size={18} />설명한 내용은 상세 설명과 홍보 문구에 반영됩니다.</div>
                            <textarea value={farmerNotes} onChange={(event) => setFarmerNotes(event.target.value)} placeholder="예: 오늘 수확한 감자입니다. 단단하고 포슬포슬해서 찌거나 구워 먹기 좋고 주문이 들어오면 바로 선별해서 보내드립니다." style={{ ...inputStyle, minHeight: 180, resize: 'vertical' }} />
                            {speechError ? <div style={{ color: '#b91c1c', marginTop: 12 }}>{speechError}</div> : null}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
                                <button onClick={onToggleVoice} style={{ ...buttonStyle, background: isListening ? '#8f2d2d' : '#163824' }} type="button"><Mic size={20} />{isListening ? '듣는 중 멈추기' : '음성 입력'}</button>
                                <div style={{ color: '#47624e' }}>{speechSupported ? '말한 내용은 메모칸에 바로 추가됩니다.' : '이 브라우저에서는 음성 입력을 지원하지 않습니다.'}</div>
                            </div>
                        </div>

                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#47624e', marginBottom: 18 }}><Sparkles size={18} />상품명, 설명, FAQ, 홍보 문구를 한 번에 만들어 줍니다.</div>
                            <button onClick={onGenerate} disabled={isGenerating} style={{ ...buttonStyle, opacity: isGenerating ? 0.7 : 1 }} type="button"><Sparkles size={20} />{isGenerating ? 'AI 작성 중입니다' : 'AI로 자동 작성'}</button>
                            <div style={{ color: '#47624e', marginTop: 14 }}>{statusMessage}</div>
                        </div>

                        {draft ? (
                            <>
                                <div style={{ ...cardStyle, display: 'grid', gap: 16 }}>
                                    <label>상품명<input value={draft.productName} onChange={(event) => setDraft((previous) => (previous ? { ...previous, productName: event.target.value } : previous))} style={inputStyle} type="text" /></label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                        <label>수확일<input value={draft.harvestDate} onChange={(event) => setDraft((previous) => (previous ? { ...previous, harvestDate: event.target.value } : previous))} style={inputStyle} type="date" /></label>
                                        <label>판매가<input value={manualPrice} onChange={(event) => setManualPrice(event.target.value)} style={inputStyle} type="number" /></label>
                                    </div>
                                    <label>한 줄 소개<textarea value={draft.summary} onChange={(event) => setDraft((previous) => (previous ? { ...previous, summary: event.target.value } : previous))} style={{ ...inputStyle, minHeight: 90 }} /></label>
                                    <label>상세 설명<textarea value={draft.description} onChange={(event) => setDraft((previous) => (previous ? { ...previous, description: event.target.value } : previous))} style={{ ...inputStyle, minHeight: 220 }} /></label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                                        {[['수확 안내', draft.harvestDateLabel], ['보관법', draft.storageGuide], ['배송 안내', draft.shippingGuide], ['키워드', draft.keywords.map((keyword) => `#${keyword}`).join(' ')], ['예상 정산', `${Math.max(0, (manualPrice ? Number(manualPrice) : draft.suggestedPrice) - Math.round((manualPrice ? Number(manualPrice) : draft.suggestedPrice) * 0.1) - draft.logisticsFee).toLocaleString()}원`], ['권장 재고', `${draft.recommendedStock}개`]].map(([label, value]) => <div key={label} style={{ borderRadius: 18, background: '#f6f9f3', border: '1px solid #d9e4d2', padding: 16 }}><div style={{ fontSize: '.95rem', color: '#47624e', marginBottom: 8 }}>{label}</div><div style={{ fontWeight: 800, color: '#163824' }}>{value}</div></div>)}
                                    </div>
                                </div>

                                <div style={{ ...cardStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                                    <ResultCard title="네이버 블로그 글" text={draft.naverBlogPost} />
                                    <ResultCard title="카카오톡 홍보 메시지" text={draft.kakaoPromoMessage} />
                                    <ResultCard title="SNS 문구" text={draft.snsCaption} />
                                </div>

                                <div style={cardStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, color: '#163824' }}><MessageCircleMore size={18} />챗봇 답변 준비</div>
                                    <div style={{ display: 'grid', gap: 12 }}>{draft.faq.map((item, index) => <div key={`${item.question}-${index}`} style={{ padding: '16px 18px', borderRadius: 18, background: '#f6f9f3', border: '1px solid #d9e4d2' }}><div style={{ fontWeight: 800, marginBottom: 8 }}>Q. {item.question}</div><div style={{ color: '#35543f', lineHeight: 1.7 }}>A. {item.answer}</div></div>)}</div>
                                </div>

                                <button onClick={onSubmit} disabled={isSubmitting} style={{ ...buttonStyle, width: '100%', fontSize: '1.25rem', padding: '22px 28px', opacity: isSubmitting ? 0.7 : 1 }} type="button"><Check size={22} />{isSubmitting ? '판매 등록 중입니다' : '판매 시작하기'}</button>
                            </>
                        ) : null}
                    </div>
                </section>
            </div>
        </div>
    );
}

function ResultCard({ title, text }: { title: string; text: string }) {
    return <div style={{ background: '#fffef8', border: '1px solid #d5dfd2', borderRadius: 24, padding: 18, minHeight: 220 }}><div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, color: '#163824' }}>{title}</div><div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: 1.72, color: '#35543f' }}>{text}</div></div>;
}
