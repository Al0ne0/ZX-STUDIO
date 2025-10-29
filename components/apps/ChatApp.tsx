import React, { useRef, useEffect } from 'react';
import { Message } from '../../types';
import ChatMessage from '../ChatMessage';

interface ChatAppProps {
    messages: Message[];
}

const ChatApp: React.FC<ChatAppProps> = ({ messages }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="h-full w-full flex flex-col p-2 space-y-4 overflow-y-auto">
             {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={chatEndRef} />
        </div>
    );
};

export default ChatApp;
