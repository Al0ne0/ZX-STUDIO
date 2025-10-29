import React, { useRef } from 'react';
import { ICONS } from '../constants';

interface ImportButtonProps {
    onImport: (files: FileList) => void;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onImport(e.target.files);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors flex-shrink-0 hover:bg-white/10"
            style={{
                backgroundColor: 'rgba(var(--background-rgb), 0.5)',
                color: 'var(--text-color)',
            }}
            title="Import Files"
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
            />
            <div className="w-5 h-5 flex-shrink-0">{ICONS.upload}</div>
            <span className="truncate max-w-[100px] hidden sm:inline">Import Files</span>
        </button>
    );
};

export default ImportButton;