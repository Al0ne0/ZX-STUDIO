
import React from 'react';

interface NotepadAppProps {
    content: string;
    onContentChange: (newContent: string) => void;
}

const NotepadApp: React.FC<NotepadAppProps> = ({ content, onContentChange }) => {
    return (
        <div className="h-full w-full text-cyan-200 bg-transparent font-roboto-mono text-sm">
            <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-full p-2 bg-transparent border-0 resize-none focus:outline-none"
                style={{ color: 'var(--text-color)'}}
            />
        </div>
    );
};

export default NotepadApp;
