import React, { useState, useRef, useEffect } from 'react';
import { VFSFile } from '../../types';
import { ICONS } from '../../constants';

interface FileManagerAppProps {
    files: VFSFile[];
    onSetBackground: (file: VFSFile) => void;
    onDeleteFile: (fileId: string) => void;
}

const FileItem: React.FC<{ file: VFSFile; onContextMenu: (e: React.MouseEvent, file: VFSFile) => void; }> = ({ file, onContextMenu }) => {
    const getFileIcon = () => {
        if (file.type.startsWith('image/')) return ICONS.imageFile;
        if (file.type.startsWith('video/')) return ICONS.videoFile;
        return ICONS.genericFile;
    };

    return (
        <div 
            className="flex flex-col items-center justify-center text-center w-24 h-24 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/10"
            onContextMenu={(e) => onContextMenu(e, file)}
            title={file.name}
        >
            <div className="w-8 h-8 mb-1" style={{ color: 'var(--text-color)'}}>
                {getFileIcon()}
            </div>
            <span className="text-xs text-white break-all truncate w-full">
                {file.name}
            </span>
        </div>
    );
};

const FileManagerApp: React.FC<FileManagerAppProps> = ({ files, onSetBackground, onDeleteFile }) => {
    const [menu, setMenu] = useState<{ x: number, y: number, file: VFSFile } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menu]);

    const handleContextMenu = (e: React.MouseEvent, file: VFSFile) => {
        e.preventDefault();
        setMenu({ x: e.pageX, y: e.pageY, file });
    };

    const handleSetBgClick = () => {
        if (menu) {
            onSetBackground(menu.file);
            setMenu(null);
        }
    };

    const handleDeleteClick = () => {
        if (menu) {
            onDeleteFile(menu.file.id);
            setMenu(null);
        }
    };

    return (
        <div className="w-full h-full p-2">
            <div className="grid grid-cols-auto-fill-100 gap-4">
                {files.map(file => (
                    <FileItem key={file.id} file={file} onContextMenu={handleContextMenu} />
                ))}
            </div>
            
            {files.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <p>No files yet. Use the "Import" icon on the desktop.</p>
                </div>
            )}

            {menu && (
                <div
                    ref={menuRef}
                    className="absolute z-50 backdrop-blur-lg border rounded-md shadow-2xl py-1"
                    style={{ top: menu.y, left: menu.x, backgroundColor: 'rgba(var(--background-rgb), 0.8)', borderColor: 'rgba(var(--primary-rgb), 0.3)' }}
                >
                    <button onClick={handleSetBgClick} className="w-full px-4 py-2 text-sm text-left hover:bg-white/10">Set as Background</button>
                    <button onClick={handleDeleteClick} className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-500/10">Delete File</button>
                </div>
            )}
        </div>
    );
};

export default FileManagerApp;
