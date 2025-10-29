import React, { useState, useRef, useEffect } from 'react';
import { SavedWallpaper, VFSFile } from '../../types';
import { ICONS } from '../../constants';

interface WallpaperManagerAppProps {
    wallpapers: SavedWallpaper[];
    vfsFiles: VFSFile[];
    onSetWallpaper: (file: VFSFile) => void;
    onDeleteWallpaper: (wallpaperId: string) => void;
    onDownloadWallpaper: (wallpaper: SavedWallpaper) => void;
}

const WallpaperItem: React.FC<{ 
    wallpaper: SavedWallpaper; 
    onContextMenu: (e: React.MouseEvent, wallpaper: SavedWallpaper) => void;
    onSetWallpaper: () => void;
}> = ({ wallpaper, onContextMenu, onSetWallpaper }) => {
    return (
        <div 
            className="relative group aspect-video bg-black/30 rounded-md cursor-pointer overflow-hidden"
            onContextMenu={(e) => onContextMenu(e, wallpaper)}
            onDoubleClick={onSetWallpaper}
        >
            {wallpaper.type === 'image' ? (
                <img src={wallpaper.url} alt={wallpaper.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            ) : (
                <video src={wallpaper.url} muted loop className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-xs text-white truncate">{wallpaper.prompt}</p>
            </div>
        </div>
    );
};

const WallpaperManagerApp: React.FC<WallpaperManagerAppProps> = ({ wallpapers, vfsFiles, onSetWallpaper, onDeleteWallpaper, onDownloadWallpaper }) => {
    const [menu, setMenu] = useState<{ x: number, y: number, wallpaper: SavedWallpaper } | null>(null);
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

    const handleContextMenu = (e: React.MouseEvent, wallpaper: SavedWallpaper) => {
        e.preventDefault();
        setMenu({ x: e.pageX, y: e.pageY, wallpaper });
    };

    const handleSetBgClick = () => {
        if (!menu) return;
        const file = vfsFiles.find(f => f.id === menu.wallpaper.fileId);
        if (file) {
            onSetWallpaper(file);
        }
        setMenu(null);
    };

    const handleDeleteClick = () => {
        if (menu && window.confirm("Are you sure you want to delete this wallpaper?")) {
            onDeleteWallpaper(menu.wallpaper.id);
        }
        setMenu(null);
    };

    const handleDownloadClick = () => {
        if (menu) {
            onDownloadWallpaper(menu.wallpaper);
        }
        setMenu(null);
    };

    return (
        <div className="w-full h-full p-2 overflow-y-auto">
            {wallpapers.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <p>No saved wallpapers. Generate a background to save it here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wallpapers.map(wp => (
                        <WallpaperItem 
                            key={wp.id} 
                            wallpaper={wp} 
                            onContextMenu={handleContextMenu}
                            onSetWallpaper={() => {
                                const file = vfsFiles.find(f => f.id === wp.fileId);
                                if (file) onSetWallpaper(file);
                            }}
                        />
                    ))}
                </div>
            )}

            {menu && (
                <div
                    ref={menuRef}
                    className="absolute z-50 backdrop-blur-lg border rounded-md shadow-2xl py-1 w-48"
                    style={{ top: menu.y, left: menu.x, backgroundColor: 'rgba(var(--background-rgb), 0.8)', borderColor: 'rgba(var(--primary-rgb), 0.3)' }}
                >
                    <button onClick={handleSetBgClick} className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-white/10">
                       {ICONS.image} Set as Background
                    </button>
                     <button onClick={handleDownloadClick} className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-white/10">
                       {ICONS.download} Download
                    </button>
                    <button onClick={handleDeleteClick} className="flex items-center w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-500/10">
                       {ICONS.uninstall} Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default WallpaperManagerApp;
