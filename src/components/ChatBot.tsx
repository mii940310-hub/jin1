'use client';

import { Mic, Square } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type SpeechRecognitionConstructor = new () => SpeechRecognition;
type ProductContext = {
    ai_generated_title?: string | null;
    description?: string | null;
    harvest_date?: string | null;
    name?: string | null;
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

    interface SpeechRecognitionEvent extends Event {
        results: SpeechRecognitionResultList;
    }

    interface SpeechRecognitionErrorEvent extends Event {
        error: string;
    }

    interface SpeechRecognitionResultList {
        readonly length: number;
        [index: number]: SpeechRecognitionResult;
    }

    interface SpeechRecognitionResult {
        readonly isFinal: boolean;
        readonly length: number;
        [index: number]: SpeechRecognitionAlternative;
    }

    interface SpeechRecognitionAlternative {
        readonly confidence: number;
        readonly transcript: string;
    }
}

export default function ChatBot() {
    const pathname = usePathname();
    const [productContext, setProductContext] = useState<ProductContext | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
        { role: 'assistant', content: '안녕하세요. 숨팜 AI 상담 도우미입니다. 배송이나 상품 정보가 궁금하시면 편하게 물어보세요.' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const speechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!Recognition) {
            return;
        }

        const recognition = new Recognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0]?.transcript || '')
                .join('')
                .trim();

            setInput(transcript);
            setSpeechError(null);
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed') {
                setSpeechError('마이크 권한이 차단되어 있습니다. 브라우저 권한을 확인해 주세요.');
            } else if (event.error === 'no-speech') {
                setSpeechError('음성이 감지되지 않았습니다. 다시 말씀해 주세요.');
            } else {
                setSpeechError('음성 입력을 처리하지 못했습니다. 다시 시도해 주세요.');
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            recognitionRef.current = null;
        };
    }, []);

    useEffect(() => {
        const fetchContext = async () => {
            if (!isSupabaseConfigured) {
                setProductContext(null);
                return;
            }

            if (pathname?.startsWith('/products/')) {
                const parts = pathname.split('/');
                const id = parts[2];
                if (id && id !== 'new') {
                    const { data } = await supabase
                        .from('products')
                        .select('name, harvest_date, description, ai_generated_title')
                        .eq('id', id)
                        .single();
                    if (data) {
                        setProductContext(data);
                    }
                }
            } else {
                setProductContext(null);
            }
        };

        void fetchContext();
    }, [pathname]);

    const handleSend = async () => {
        if (!input.trim()) {
            return;
        }

        const userText = input.trim();
        const newMessages: { role: 'user' | 'assistant'; content: string }[] = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, productContext }),
            });

            const data = await res.json();
            if (data.reply) {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', content: '죄송합니다. 잠시 후 다시 시도해 주세요.' }]);
            }
        } catch {
            setMessages((prev) => [...prev, { role: 'assistant', content: '네트워크 오류가 발생했습니다.' }]);
        }
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            setSpeechError('이 브라우저는 음성 입력을 지원하지 않습니다.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        setSpeechError(null);
        setIsListening(true);
        recognitionRef.current.start();
    };

    return (
        <div style={{ bottom: '24px', fontFamily: 'inherit', position: 'fixed', right: '24px', zIndex: 1000 }}>
            {!isOpen && (
                <button
                    className="bounce"
                    onClick={() => setIsOpen(true)}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    style={{
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '50%',
                        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        fontSize: '1.75rem',
                        height: '64px',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        width: '64px',
                    }}
                >
                    챗
                </button>
            )}

            {isOpen && (
                <div
                    style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '500px',
                        overflow: 'hidden',
                        width: '350px',
                    }}
                >
                    <div style={{ alignItems: 'center', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
                        <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>숨팜</div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>AI 상담 도우미</h3>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>배송과 상품 정보를 도와드려요</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', padding: '4px' }}
                        >
                            &times;
                        </button>
                    </div>

                    <div style={{ background: '#f8fafc', display: 'flex', flex: 1, flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '16px' }}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    maxWidth: '80%',
                                }}
                            >
                                {msg.role === 'assistant' && <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: '4px' }}>도우미</div>}
                                <div
                                    style={{
                                        background: msg.role === 'user' ? 'var(--primary)' : 'white',
                                        borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        color: msg.role === 'user' ? 'white' : '#333',
                                        fontSize: '0.95rem',
                                        lineHeight: 1.5,
                                        padding: '12px 16px',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', background: 'white', borderRadius: '16px 16px 16px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: 'var(--muted)', display: 'flex', fontSize: '0.9rem', gap: '4px', padding: '12px 16px' }}>
                                <span className="dot-typing" /> 답변을 준비하고 있어요...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ background: 'white', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                        {speechError && (
                            <div style={{ color: '#b91c1c', fontSize: '0.85rem', lineHeight: 1.4 }}>
                                {speechError}
                            </div>
                        )}
                        {!speechSupported && (
                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                음성 입력은 Chrome 계열 브라우저에서 가장 안정적으로 동작합니다.
                            </div>
                        )}
                        {isListening && (
                            <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                듣고 있습니다. 말씀하신 내용이 입력창에 들어갑니다.
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                disabled={loading}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="배송, 수확, 보관법 등을 물어보세요."
                                style={{ background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '24px', flex: 1, outline: 'none', padding: '12px' }}
                                type="text"
                                value={input}
                            />
                            <button
                                disabled={!speechSupported || loading}
                                onClick={toggleVoiceInput}
                                style={{
                                    alignItems: 'center',
                                    background: isListening ? '#fee2e2' : '#ecfdf5',
                                    border: `1px solid ${isListening ? '#fecaca' : '#a7f3d0'}`,
                                    borderRadius: '50%',
                                    color: isListening ? '#b91c1c' : '#047857',
                                    cursor: !speechSupported || loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    height: '42px',
                                    justifyContent: 'center',
                                    opacity: !speechSupported || loading ? 0.5 : 1,
                                    width: '42px',
                                }}
                            >
                                {isListening ? <Square size={18} /> : <Mic size={18} />}
                            </button>
                            <button
                                disabled={loading}
                                onClick={handleSend}
                                style={{ alignItems: 'center', background: 'var(--primary)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', height: '42px', justifyContent: 'center', width: '42px' }}
                            >
                                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                .bounce { animation: bounce 4s infinite; }
            ` }}
            />
        </div>
    );
}
