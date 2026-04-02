'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Mic, Square } from 'lucide-react';

type SpeechRecognitionConstructor = new () => SpeechRecognition;
type ProductContext = {
    ai_generated_title?: string | null;
    ai_price_reason?: string | null;
    ai_price_recommendation?: number | null;
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
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: '안녕하세요! 슝팜의 AI 상담사 슝이입니다 🥬 무엇을 도와드릴까요?' }
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
                setSpeechError('마이크 권한이 차단되어 있습니다. 브라우저 권한을 확인해주세요.');
            } else if (event.error === 'no-speech') {
                setSpeechError('음성이 감지되지 않았습니다. 다시 말씀해주세요.');
            } else {
                setSpeechError('음성 입력을 처리하지 못했습니다. 다시 시도해주세요.');
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
                    const { data } = await supabase.from('products').select('name, harvest_date, description, ai_generated_title, ai_price_recommendation, ai_price_reason').eq('id', id).single();
                    if (data) setProductContext(data);
                }
            } else {
                setProductContext(null);
            }
        };
        fetchContext();
    }, [pathname]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input.trim();
        const newMessages: { role: 'user' | 'assistant', content: string }[] = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, productContext })
            });

            const data = await res.json();
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다, 잠시 후 다시 시도해주세요.' }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: '네트워크 오류가 발생했습니다 😅' }]);
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
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'inherit' }}>
            {/* Chatbot Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bounce"
                    style={{
                        width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white', border: 'none', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: '350px', height: '500px', background: 'white', borderRadius: '16px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
                    border: '1px solid var(--border)', overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '1.5rem' }}>🧑‍🌾</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI 상담사 슝이</h3>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>고랭지 농산물 특화 상담</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '4px' }}
                        >
                            &times;
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '4px'
                            }}>
                                {msg.role === 'assistant' && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '4px' }}>슝이</div>}
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                    background: msg.role === 'user' ? 'var(--primary)' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#333',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    lineHeight: 1.5,
                                    fontSize: '0.95rem',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '0.9rem', color: 'var(--muted)', display: 'flex', gap: '4px' }}>
                                <span className="dot-typing"></span> 슝이가 타이핑 중...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '16px', background: 'white', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="강원도 채소에 대해 물어보세요!"
                            disabled={loading}
                            style={{ flex: 1, padding: '12px', borderRadius: '24px', border: '1px solid var(--border)', outline: 'none', background: '#f1f5f9' }}
                        />
                        <button
                            type="button"
                            onClick={toggleVoiceInput}
                            disabled={!speechSupported || loading}
                            title={isListening ? '음성 입력 중지' : '음성 입력 시작'}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: isListening ? '#fee2e2' : '#ecfdf5',
                                color: isListening ? '#b91c1c' : '#047857',
                                border: '1px solid ' + (isListening ? '#fecaca' : '#a7f3d0'),
                                cursor: !speechSupported || loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: !speechSupported || loading ? 0.5 : 1
                            }}
                        >
                            {isListening ? <Square size={18} /> : <Mic size={18} />}
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
                    40% {transform: translateY(-10px);}
                    60% {transform: translateY(-5px);}
                }
                .bounce { animation: bounce 4s infinite; }
            `}} />
        </div>
    );
}
