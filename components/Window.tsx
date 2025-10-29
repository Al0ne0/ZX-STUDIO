import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WindowInstance, AppType, WindowState, Message, VFSFile } from '../types';
import { ICONS } from '../constants';
import NotepadApp from './apps/NotepadApp';
import WebSearchApp from './apps/WebSearchApp';
import SystemStatusApp from './apps/SystemStatusApp';
import MediaViewerApp from './apps/MediaViewerApp';
import HtmlApp from './apps/HtmlApp';
import ImageGeneratorApp from './apps/ImageGeneratorApp';
import FileManagerApp from './apps/FileManagerApp';
import WebBrowserApp from './apps/WebBrowserApp';
import AgentManagerApp from './apps/AgentManagerApp';
import AppBuilderApp from './apps/AppBuilderApp';
import WallpaperManagerApp from './apps/WallpaperManagerApp';


interface WindowProps {
    instance: WindowInstance;
    onClose: (id: string) => void;
    onFocus: (id: string) => void;
    onMinimize: (id: string) => void;
    onToggleMaximize: (id: string) => void;
    onContentChange?: (id: string, newContent: any) => void;
    isDraggable?: boolean;
    isMaximizable?: boolean;
    messages: Message[];
    vfsFiles: VFSFile[];
}

const Window: React.FC<WindowProps> = ({ 
    instance, onClose, onFocus, onMinimize, onToggleMaximize, onContentChange,
    isDraggable = true, isMaximizable = true, messages, vfsFiles
}) => {
    const [position, setPosition] = useState(instance.position);
    const [size, setSize] = useState({ 
        width: instance.size?.width || 500, 
        height: instance.size?.height || 400 
    });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);
    const isMaximized = instance.state === WindowState.MAXIMIZED;

    useEffect(() => {
        setPosition(instance.position);
    }, [instance.position]);

    useEffect(() => {
        const constrainWindow = () => {
            if (!windowRef.current?.parentElement || isMaximized) return;

            const parentRect = windowRef.current.parentElement.getBoundingClientRect();
            const baseWidth = instance.size?.width || 500;
            const baseHeight = instance.size?.height || 400;

            const newWidth = Math.min(baseWidth, parentRect.width - 16);
            const newHeight = Math.min(baseHeight, parentRect.height - 16);
            setSize({ width: newWidth, height: newHeight });

            let newX = position.x;
            let newY = position.y;

            if (newX + newWidth > parentRect.width - 8) {
                newX = parentRect.width - newWidth - 8;
            }
            if (newY + newHeight > parentRect.height - 8) {
                newY = parentRect.height - newHeight - 8;
            }
            newX = Math.max(8, newX);
            newY = Math.max(8, newY);

            if (newX !== position.x || newY !== position.y) {
                setPosition({ x: newX, y: newY });
            }
        };

        const debouncedConstrain = setTimeout(constrainWindow, 50);
        window.addEventListener('resize', constrainWindow);
        
        return () => {
            clearTimeout(debouncedConstrain);
            window.removeEventListener('resize', constrainWindow);
        };
    }, [instance.size, isMaximized, position]);


    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMaximized || !windowRef.current || (e.target as HTMLElement).closest('button') || !isDraggable) return;
        onFocus(instance.id);
        const rect = windowRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        setIsDragging(true);
    };
    
    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            // This now correctly passes the entire instance with the updated position
            // to be handled by the logic in App.tsx
            onContentChange?.(instance.id, { ...instance, position });
        }
    }, [isDragging, instance, position, onContentChange]);


    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !windowRef.current?.parentElement) return;

        const parentRect = windowRef.current.parentElement.getBoundingClientRect();
        
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        newX = Math.max(0, Math.min(newX, parentRect.width - size.width));
        newY = Math.max(0, Math.min(newY, parentRect.height - size.height));

        setPosition({ x: newX, y: newY });
    }, [isDragging, size.width, size.height]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const getAppIcon = () => {
        switch (instance.appType) {
            case AppType.NOTEPAD: return ICONS.notepad;
            case AppType.WEB_SEARCH: return ICONS.search;
            case AppType.SYSTEM_STATUS: return ICONS.status;
            case AppType.FILE_MANAGER: return ICONS.fileManager;
            case AppType.WEB_BROWSER: return ICONS.webBrowser;
            case AppType.IMAGE_GENERATOR: return ICONS.image;
            case AppType.VIDEO_GENERATOR: return ICONS.image;
            case AppType.AGENT_MANAGER: return ICONS.agentManager;
            case AppType.APP_BUILDER: return ICONS.appBuilder;
            case AppType.WALLPAPER_MANAGER: return ICONS.wallpaperManager;
            case AppType.HTML_APP:
                 return instance.content.icon ? <div className="h-5 w-5 mr-2" dangerouslySetInnerHTML={{ __html: instance.content.icon }} /> : null;
            default: return null;
        }
    };
    
    const renderAppContent = () => {
        switch (instance.appType) {
            case AppType.FILE_MANAGER:
                 return <FileManagerApp files={vfsFiles} onSetBackground={instance.content.onSetBackground} onDeleteFile={instance.content.onDeleteFile} />;
            case AppType.NOTEPAD:
                return <NotepadApp 
                    content={instance.content} 
                    onContentChange={(newContent) => onContentChange?.(instance.id, newContent)}
                />;
            case AppType.WEB_SEARCH:
                return <WebSearchApp content={instance.content} />;
            case AppType.SYSTEM_STATUS:
                return <SystemStatusApp />;
             case AppType.MEDIA_VIEWER:
                return <MediaViewerApp content={instance.content} />;
             case AppType.HTML_APP:
                return <HtmlApp content={instance.content} />;
             case AppType.WEB_BROWSER:
                return <WebBrowserApp content={instance.content} />;
            case AppType.IMAGE_GENERATOR:
            case AppType.VIDEO_GENERATOR:
                return <ImageGeneratorApp content={instance.content} appType={instance.appType} />;
            case AppType.AGENT_MANAGER:
                 return <AgentManagerApp agents={instance.content.agents} onAgentsChange={instance.content.onAgentsChange} />;
            case AppType.APP_BUILDER:
                return <AppBuilderApp 
                    projects={instance.content.projects}
                    onProjectsChange={instance.content.onProjectsChange}
                    onInstall={instance.content.onInstall}
                    getAiCodeHelp={instance.content.getAiCodeHelp}
                    generateIcon={instance.content.generateIcon}
                />;
            case AppType.WALLPAPER_MANAGER:
                return <WallpaperManagerApp
                    wallpapers={instance.content.wallpapers}
                    vfsFiles={instance.content.vfsFiles}
                    onSetWallpaper={instance.content.onSetWallpaper}
                    onDeleteWallpaper={instance.content.onDeleteWallpaper}
                    onDownloadWallpaper={instance.content.onDownloadWallpaper}
                />;
            default:
                return null;
        }
    };

    return (
        <div
            ref={windowRef}
            className="absolute backdrop-blur-lg border rounded-lg shadow-2xl flex flex-col transition-all duration-200 ease-in-out"
            style={{
                left: isMaximized ? '0' : `${position.x}px`,
                top: isMaximized ? '0' : `${position.y}px`,
                width: isMaximized ? '100%' : `${size.width}px`,
                height: isMaximized ? '100%' : `${size.height}px`,
                cursor: isDragging ? 'grabbing' : 'default',
                borderRadius: isMaximized ? '0' : undefined,
                backgroundColor: 'rgba(var(--background-rgb), 0.6)',
                borderColor: 'rgba(var(--primary-rgb), 0.3)',
                boxShadow: `0 25px 50px -12px rgba(var(--primary-rgb), 0.2)`
            }}
            onMouseDown={() => onFocus(instance.id)}
        >
            <header
                className="flex items-center justify-between p-2 rounded-t-lg border-b"
                onMouseDown={handleMouseDown}
                style={{ 
                    cursor: isMaximized || !isDraggable ? 'default' : 'grab',
                    backgroundColor: 'rgba(var(--background-rgb), 0.5)',
                    borderBottomColor: 'rgba(var(--primary-rgb), 0.2)',
                    borderRadius: isMaximized ? '0' : undefined,
                }}
            >
                <div className="flex items-center font-bold text-sm" style={{ color: 'var(--text-color)'}}>
                    {getAppIcon()}
                    <span>{instance.title}</span>
                </div>
                 <div className="flex items-center space-x-1">
                     <button
                        onClick={() => onMinimize(instance.id)}
                        className="p-1 rounded-full hover:bg-yellow-500/50 transition-colors"
                        style={{ color: 'var(--text-color)'}}
                    >
                        {ICONS.minimize}
                    </button>
                    {isMaximizable && (
                        <button
                            onClick={() => onToggleMaximize(instance.id)}
                            className="p-1 rounded-full hover:bg-green-500/50 transition-colors"
                            style={{ color: 'var(--text-color)'}}
                        >
                            {isMaximized ? ICONS.restore : ICONS.maximize}
                        </button>
                    )}
                    {(instance.isClosable === undefined || instance.isClosable) && (
                        <button
                            onClick={() => onClose(instance.id)}
                            className="p-1 rounded-full hover:bg-red-500/50 transition-colors"
                            style={{ color: 'var(--text-color)'}}
                        >
                            {ICONS.close}
                        </button>
                    )}
                </div>
            </header>
            <main className={`flex-grow p-1 overflow-auto bg-white/10 ${isDragging ? 'pointer-events-none' : ''}`}>
                {renderAppContent()}
            </main>
        </div>
    );
};

export default Window;