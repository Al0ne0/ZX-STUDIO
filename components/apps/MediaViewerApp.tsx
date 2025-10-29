import React from 'react';

interface MediaViewerAppProps {
    content: {
        url: string;
        type: string;
        name: string;
    };
}

const MediaViewerApp: React.FC<MediaViewerAppProps> = ({ content }) => {
    const { url, type, name } = content;

    const isVideo = type.startsWith('video/');
    const isImage = type.startsWith('image/');

    return (
        <div className="w-full h-full flex items-center justify-center bg-black/50">
            {isImage && (
                <img src={url} alt={name} className="max-w-full max-h-full object-contain" />
            )}
            {isVideo && (
                <video src={url} controls className="max-w-full max-h-full" />
            )}
            {!isImage && !isVideo && (
                <p style={{ color: 'var(--text-color)' }}>Unsupported file type: {type}</p>
            )}
        </div>
    );
};

export default MediaViewerApp;
