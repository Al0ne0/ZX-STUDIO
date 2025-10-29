import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { ICONS } from '../constants';
import ChatMessage from './ChatMessage';

interface CommandCenterProps {
    messages: Message[];
    onCommandSubmit: (command: string) => void;
    isLoading: boolean;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ messages, onCommandSubmit, isLoading }) => {
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCommandSubmit(input);
        setInput('');
    };

    return (
        <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 w-full max-w-3xl h-[60vh] z-20 flex flex-col shadow-2xl">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto backdrop-blur-lg border border-b-0 rounded-t-lg"
                 style={{
                    backgroundColor: 'rgba(var(--background-rgb), 0.7)',
                    borderColor: 'rgba(var(--primary-rgb), 0.3)',
                 }}>
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex-shrink-0 flex items-center gap-2 p-3 backdrop-blur-lg border rounded-b-lg"
                 style={{
                    backgroundColor: 'rgba(var(--background-rgb), 0.7)',
                    borderColor: 'rgba(var(--primary-rgb), 0.3)',
                 }}>
                 <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isLoading ? "Thinking..." : "Enter a command..."}
                    disabled={isLoading}
                    className="flex-grow text-cyan-200 rounded-lg px-4 py-3 border focus:outline-none focus:ring-2 transition-all duration-300 font-roboto-mono"
                    style={{
                        backgroundColor: 'rgba(var(--background-rgb), 0.7)',
                        color: 'var(--text-color)',
                        borderColor: 'rgba(var(--primary-rgb), 0.3)',
                        '--tw-ring-color': 'var(--primary-color)'
                    } as React.CSSProperties}
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="text-slate-900 rounded-lg p-3 transition-all duration-300 focus:outline-none focus:ring-2 disabled:cursor-not-allowed"
                     style={{
                        backgroundColor: isLoading || !input.trim() ? 'rgba(var(--text-rgb), 0.2)' : 'var(--primary-color)',
                        color: isLoading || !input.trim() ? 'rgba(var(--text-rgb), 0.5)' : 'var(--background-color)',
                        '--tw-ring-color': 'var(--primary-color)'
                    } as React.CSSProperties}
                >
                    {ICONS.send}
                </button>
            </form>
        </div>
    );
};

export default CommandCenter;
