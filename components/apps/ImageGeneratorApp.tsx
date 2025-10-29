import React from 'react';
import { AppType } from '../../types';
import LoadingSpinner from '../LoadingSpinner';

interface GeneratorUIProps {
    mediaType: 'image' | 'video';
    // Fix: Allow 'success' as a valid status to resolve the type error.
    status: 'generating' | 'error' | 'success';
}

const GeneratorPlaceholder: React.FC<GeneratorUIProps> = ({ mediaType, status }) => {
    const isError = status === 'error';
    const text = isError ? `Failed to generate ${mediaType}.` : `Generating ${mediaType}...`;
    const subtext = isError ? 'Please try a different prompt or check API quota.' : 'This may take a moment.';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            {!isError && (
                 <div className="w-24 h-24 mb-4">
                    <LoadingSpinner />
                 </div>
            )}
             {isError && (
                <div className="w-16 h-16 mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
            )}
            <p className="font-bold" style={{ color: isError ? '#f87171' : 'var(--primary-color)' }}>{text}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-color)', opacity: 0.7 }}>{subtext}</p>
        </div>
    );
};


interface ImageGeneratorAppProps {
    content: {
        prompt: string;
        imageUrl?: string | null;
        status?: 'generating' | 'success' | 'error';
    };
    appType: AppType.IMAGE_GENERATOR | AppType.VIDEO_GENERATOR;
}

const ImageGeneratorApp: React.FC<ImageGeneratorAppProps> = ({ content, appType }) => {
    const { prompt, imageUrl, status = 'generating' } = content;
    const mediaType = appType === AppType.IMAGE_GENERATOR ? 'image' : 'video';

    return (
        <div className="flex flex-col h-full">
            <p 
                className="mb-4 font-roboto-mono text-sm flex-shrink-0"
                style={{ color: 'var(--primary-color)'}}
            >&gt; {prompt}</p>
            <div 
                className="flex-grow rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'rgba(var(--background-rgb), 0.5)'}}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain rounded-md" />
                ) : (
                   <GeneratorPlaceholder mediaType={mediaType} status={status} />
                )}
            </div>
        </div>
    );
};

export default ImageGeneratorApp;