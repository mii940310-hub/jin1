'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

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
        resultIndex: number;
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

interface VoiceInputProps {
    onTranscriptComplete: (text: string) => void;
}

export default function VoiceInput({ onTranscriptComplete }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!Recognition) {
            return;
        }

        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ko-KR';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const piece = event.results[index][0]?.transcript || '';

                if (event.results[index].isFinal) {
                    finalTranscript += piece;
                } else {
                    interimTranscript += piece;
                }
            }

            setTranscript((previous) => {
                const nextFinal = `${previous}${finalTranscript}`;

                if (finalTranscript) {
                    onTranscriptComplete(nextFinal.trim());
                }

                return `${nextFinal}${interimTranscript}`;
            });
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            recognitionRef.current = null;
        };
    }, [onTranscriptComplete]);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            return;
        }

        setTranscript('');

        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div
            style={{
                padding: '24px',
                borderRadius: '24px',
                background: isRecording ? '#fee2e2' : '#f0fdf4',
                border: `2px solid ${isRecording ? '#ef4444' : '#22c55e'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.3s',
            }}
        >
            <button
                onClick={toggleRecording}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: isRecording ? '#ef4444' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    transform: isRecording ? 'scale(1.05)' : 'scale(1)',
                }}
                type="button"
            >
                {isRecording ? <Square size={48} /> : <Mic size={48} />}
            </button>

            <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: isRecording ? '#b91c1c' : '#15803d' }}>
                    {isRecording ? '말씀해 주세요...' : '버튼을 눌러 상품을 설명해 주세요'}
                </h3>
                <p style={{ fontSize: '1rem', color: '#666', margin: 0, minHeight: '24px' }}>
                    예: 오늘 수확한 감자 10kg이고 단단하고 포슬포슬합니다.
                </p>
            </div>

            {transcript ? (
                <div
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #ddd',
                        minHeight: '80px',
                        fontSize: '1.1rem',
                        lineHeight: '1.5',
                    }}
                >
                    {transcript}
                </div>
            ) : null}
        </div>
    );
}
