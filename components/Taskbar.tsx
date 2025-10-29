import React from 'react';
import { ICONS } from '../constants';
import { WindowInstance, WindowState, AppType } from '../types';
import ImportButton from './ImportIcon';

interface TaskbarProps {
    windows: WindowInstance[];
    onTaskbarItemClick: (id: string) => void;
    isTtsEnabled: boolean;
    onToggleTts: () => void;
    onFileImport: (files: FileList) => void;
    isCommandCenterOpen: boolean;
    onToggleCommandCenter: () => void;
}

const getAppIcon = (appType: AppType, content: any) => {
    switch (appType) {
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
            return content.icon ? <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: content.icon }} /> : <div className="h-5 w-5" />;
        default: return <div className="h-5 w-5" />;
    }
};


const Taskbar: React.FC<TaskbarProps> = ({ windows, onTaskbarItemClick, isTtsEnabled, onToggleTts, onFileImport, isCommandCenterOpen, onToggleCommandCenter }) => {

    const isTopWindow = (id: string) => {
        if (windows.length === 0) return false;
        const visibleWindows = windows.filter(w => w.state !== WindowState.MINIMIZED);
        if (visibleWindows.length === 0) return false;
        return visibleWindows[visibleWindows.length - 1].id === id;
    };

    return (
        <footer 
            className="w-full flex-shrink-0 backdrop-blur-md border-t p-2 flex items-center justify-between gap-4"
            style={{
                backgroundColor: 'rgba(var(--background-rgb), 0.5)',
                borderTopColor: 'rgba(var(--primary-rgb), 0.2)'
            }}
        >
             {/* Left side: Taskbar Items */}
            <div className="flex items-center gap-2 flex-shrink overflow-x-auto min-w-0">
                 <ImportButton onImport={onFileImport} />
                {windows.map(win => (
                    <button
                        key={win.id}
                        onClick={() => onTaskbarItemClick(win.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors flex-shrink-0"
                        style={{
                            backgroundColor: isTopWindow(win.id) && win.state !== WindowState.MINIMIZED ? 'rgba(var(--primary-rgb), 0.3)' : 'rgba(var(--background-rgb), 0.5)',
                            color: 'var(--text-color)',
                            border: `1px solid ${win.state === WindowState.MINIMIZED ? 'rgba(var(--primary-rgb), 0.5)' : 'transparent'}`
                        }}
                        title={win.title}
                    >
                        <div className="w-5 h-5 flex-shrink-0">{getAppIcon(win.appType, win.content)}</div>
                        <span className="truncate max-w-[100px]">{win.title}</span>
                    </button>
                ))}
            </div>

            {/* Right side: Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    type="button"
                    onClick={onToggleTts}
                    className="text-slate-900 rounded-lg p-3 transition-all duration-300 focus:outline-none focus:ring-2"
                     style={{
                        backgroundColor: isTtsEnabled ? 'var(--primary-color)' : 'rgba(var(--text-rgb), 0.2)',
                        color: isTtsEnabled ? 'var(--background-color)' : 'rgba(var(--text-rgb), 0.5)',
                        '--tw-ring-color': 'var(--primary-color)'
                    } as React.CSSProperties}
                    title={isTtsEnabled ? "Disable AI voice" : "Enable AI voice"}
                >
                    {isTtsEnabled ? ICONS.speakerOn : ICONS.speakerOff}
                </button>
                
                <button
                    type="button"
                    onClick={onToggleCommandCenter}
                    className="text-slate-900 rounded-lg p-3 transition-all duration-300 focus:outline-none focus:ring-2"
                     style={{
                        backgroundColor: isCommandCenterOpen ? 'var(--primary-color)' : 'rgba(var(--text-rgb), 0.2)',
                        color: isCommandCenterOpen ? 'var(--background-color)' : 'var(--primary-color)',
                        '--tw-ring-color': 'var(--primary-color)'
                    } as React.CSSProperties}
                    title={isCommandCenterOpen ? "Close Gemini" : "Open Gemini"}
                >
                    <div className="w-6 h-6">{ICONS.gemini}</div>
                </button>
            </div>
        </footer>
    );
};

export default Taskbar;