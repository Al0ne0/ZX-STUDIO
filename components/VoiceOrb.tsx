

import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';

interface VoiceOrbProps {
    onCommandSubmit: (command: string) => void;
    isLoading: boolean;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ onCommandSubmit, isLoading }) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Fix: Cast window to `any` to access non-standard SpeechRecognition APIs.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'es-ES';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            if (event.results && event.results.length > 0 && event.results[0].length > 0) {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    onCommandSubmit(transcript.trim());
                }
            }
        };

        recognitionRef.current = recognition;

    }, [onCommandSubmit]);

    const handleOrbClick = () => {
        if (isLoading || !recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };
    
    const getStatusText = () => {
        if (isLoading) return "Pensando...";
        if (isListening) return "Escuchando...";
        return "Habla con Gemini";
    }

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 group">
             <p className="text-xs px-2 py-1 rounded-md bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {getStatusText()}
             </p>
            <button
                onClick={handleOrbClick}
                disabled={!recognitionRef.current || isLoading}
                className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
                    border: '1px solid rgba(var(--primary-rgb), 0.5)'
                }}
            >
                <span 
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75`}
                    style={{
                        backgroundColor: 'var(--primary-color)',
                        animation: isListening ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                    }}
                />
                
                <div 
                    className="relative z-10 transition-transform duration-300"
                    style={{
                        color: 'var(--primary-color)',
                        transform: isListening || isLoading ? 'scale(1.1)' : 'scale(1)'
                    }}
                >
                    {isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--primary-color)'}} /> : ICONS.mic}
                </div>
            </button>
            <style>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default VoiceOrb;