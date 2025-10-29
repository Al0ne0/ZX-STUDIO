


import React from 'react';
import { Message, WindowInstance, WindowState, AppType, VFSFile, CustomApp } from '../types';
import Window from './Window';
import FileManagerIcon from './FileManagerIcon';
import DesktopIcon from './DesktopIcon';
import WebBrowserIcon from './WebBrowserIcon';
import Clock from './Clock';
import BatteryStatus from './BatteryStatus';
import AgentManagerIcon from './AgentManagerIcon';
import AppBuilderIcon from './AppBuilderIcon';
import WallpaperManagerIcon from './WallpaperManagerIcon';

interface DesktopProps {
    messages: Message[];
    windows: WindowInstance[];
    customApps: CustomApp[];
    vfsFiles: VFSFile[];
    closeWindow: (id: string) => void;
    bringToFront: (id: string) => void;
    minimizeWindow: (id: string) => void;
    toggleMaximizeWindow: (id: string) => void;
    onWindowContentChange: (id: string, newContent: any) => void;
    onLaunchApp: (app: CustomApp) => void;
    onEditApp: (appId: string) => void;
    onShowVersions: (appId: string) => void;
    onLaunchFileManager: () => void;
    onLaunchWebBrowser: () => void;
    onLaunchAgentManager: () => void;
    onLaunchAppBuilder: () => void;
    onLaunchWallpaperManager: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ 
    messages, windows, customApps, vfsFiles,
    closeWindow, bringToFront, minimizeWindow, toggleMaximizeWindow, onWindowContentChange,
    onLaunchApp, onEditApp, onShowVersions,
    onLaunchFileManager, onLaunchWebBrowser, onLaunchAgentManager, onLaunchAppBuilder, onLaunchWallpaperManager
}) => {
    return (
        <div className="flex-grow p-4 overflow-hidden relative">
            {/* Desktop Icons */}
            <div className="absolute top-4 left-4 flex flex-col items-center gap-4">
                <FileManagerIcon onLaunch={onLaunchFileManager} />
                <WebBrowserIcon onLaunch={onLaunchWebBrowser} />
                <AgentManagerIcon onLaunch={onLaunchAgentManager} />
                <AppBuilderIcon onLaunch={onLaunchAppBuilder} />
                <WallpaperManagerIcon onLaunch={onLaunchWallpaperManager} />
                {customApps.map(app => (
                    <DesktopIcon
                        key={app.id}
                        app={app}
                        onLaunch={onLaunchApp}
                        onEdit={onEditApp}
                        onShowVersions={onShowVersions}
                    />
                ))}
            </div>

             {/* System Info */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-right text-white text-sm" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
                <Clock />
                <BatteryStatus />
            </div>

            {/* App Windows */}
            {windows
                .filter(win => win.state !== WindowState.MINIMIZED)
                .map((win) => (
                    <Window
                        key={win.id}
                        instance={win}
                        onClose={closeWindow}
                        onFocus={bringToFront}
                        onMinimize={minimizeWindow}
                        onToggleMaximize={toggleMaximizeWindow}
                        onContentChange={onWindowContentChange}
                        isDraggable={win.isDraggable}
                        isMaximizable={win.isMaximizable}
                        messages={messages}
                        vfsFiles={vfsFiles}
                    />
            ))}
        </div>
    );
};

export default Desktop;