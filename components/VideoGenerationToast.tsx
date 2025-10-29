import React from 'react';

interface VideoGenerationToastProps {
    prompt: string;
}

const VideoGenerationToast: React.FC<VideoGenerationToastProps> = ({ prompt }) => {
    return (
        <div 
            className="flex items-center gap-4 p-3 rounded-lg shadow-lg border animate-pulse"
            style={{
                backgroundColor: 'rgba(var(--background-rgb), 0.8)',
                borderColor: 'rgba(var(--primary-rgb), 0.5)',
                color: 'var(--text-color)'
            }}
        >
            <div 
                className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2"
                style={{ borderColor: 'var(--primary-color)' }}
            />
            <div className="text-sm">
                <p className="font-bold">Generating video background...</p>
                <p className="text-xs truncate max-w-xs" style={{ color: 'rgba(var(--text-rgb), 0.7)'}}>{prompt}</p>
            </div>
        </div>
    );
};

export default VideoGenerationToast;
