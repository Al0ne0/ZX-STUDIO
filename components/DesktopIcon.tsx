
import React, { useState, useRef, useEffect } from 'react';
import { CustomApp, AppVersion } from '../types';
import { ICONS } from '../constants';

interface DesktopIconProps {
    app: CustomApp;
    onLaunch: (app: CustomApp) => void;
    onEdit: (appId: string) => void;
    onShowVersions: (appId: string) => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ app, onLaunch, onEdit, onShowVersions }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const getActiveVersion = (): AppVersion | undefined => {
        return app.versions.find(v => v.versionId === app.activeVersionId);
    };

    const activeVersion = getActiveVersion();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPosition({ x: e.pageX, y: e.pageY });
        setMenuVisible(true);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleEditClick = () => {
        onEdit(app.id);
        setMenuVisible(false);
    };

    const handleVersionsClick = () => {
        onShowVersions(app.id);
        setMenuVisible(false);
    };
    
    if (!activeVersion) return null;

    return (
        <>
            <div 
                className="flex flex-col items-center justify-center text-center w-20 h-20 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/10"
                onDoubleClick={() => onLaunch(app)}
                onContextMenu={handleContextMenu}
                title={`Double-click to open ${app.name}`}
            >
                <div 
                    className="w-8 h-8 mb-1" 
                    dangerouslySetInnerHTML={{ __html: activeVersion.icon }}
                    style={{ color: 'var(--text-color)'}}
                />
                <span className="text-xs text-white break-words" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>
                    {app.name}
                </span>
            </div>

            {menuVisible && (
                <div
                    ref={menuRef}
                    className="absolute z-50 backdrop-blur-lg border rounded-md shadow-2xl py-1"
                    style={{
                        top: menuPosition.y,
                        left: menuPosition.x,
                        backgroundColor: 'rgba(var(--background-rgb), 0.8)',
                        borderColor: 'rgba(var(--primary-rgb), 0.3)',
                    }}
                >
                    <button
                        onClick={handleEditClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-white/10"
                        style={{ color: 'var(--text-color)' }}
                    >
                        {ICONS.edit}
                        Edit
                    </button>
                    {app.versions.length > 1 && (
                         <button
                            onClick={handleVersionsClick}
                            className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-white/10"
                            style={{ color: 'var(--text-color)' }}
                        >
                            {ICONS.history}
                            Version History
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default DesktopIcon;
