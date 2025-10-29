import React from 'react';
import { Message, MessageSender } from '../types';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const getSenderStyles = (): React.CSSProperties => {
        switch (message.sender) {
            case MessageSender.USER:
                return {
                    backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
                    alignSelf: 'flex-end',
                    color: 'var(--text-color)'
                };
            case MessageSender.AI:
                 return {
                    backgroundColor: 'rgba(var(--background-rgb), 0.3)',
                    alignSelf: 'flex-start',
                    color: 'var(--text-color)',
                    borderColor: 'rgba(var(--primary-rgb), 0.1)',
                    borderWidth: '1px'
                };
            case MessageSender.SYSTEM:
                return {
                    alignSelf: 'center',
                    color: 'rgba(var(--primary-rgb), 0.8)',
                    fontSize: '0.75rem'
                };
            default:
                return { 
                    backgroundColor: 'rgba(var(--text-rgb), 0.1)',
                    alignSelf: 'flex-start'
                };
        }
    };
    
    const isSystemMessage = message.sender === MessageSender.SYSTEM;

    return (
        <div className={`flex ${message.sender === MessageSender.USER ? 'justify-end' : 'justify-start'} w-full`}>
            <div 
                className={`px-4 py-2 rounded-lg max-w-xl whitespace-pre-wrap`}
                style={getSenderStyles()}
            >
                {isSystemMessage ? `--- ${message.text} ---` : message.text}
                {message.component}
            </div>
        </div>
    );
};

export default ChatMessage;