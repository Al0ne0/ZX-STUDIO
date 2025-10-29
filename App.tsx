import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageSender, WindowInstance, AppType, WindowState, VFSFile, CustomApp, AppVersion, Agent, Project, SavedWallpaper } from './types';
import { Chat } from '@google/genai';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import VideoGenerationToast from './components/VideoGenerationToast';
import LoadingSpinner from './components/LoadingSpinner';
import VoiceOrb from './components/VoiceOrb';
import { processCommand, getVideosOperation, generateImageFromApi, generateIcon as generateIconApi, getModifiedHtml, startChat, getAiCodeHelp } from './services/geminiService';
import * as storage from './services/storageService';
import EditAppModal from './components/EditAppModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import CommandCenter from './components/CommandCenter';

const TASKBAR_HEIGHT = 68;

interface Theme { backgroundColor: string; textColor: string; primaryColor: string; }
interface Background { type: 'color' | 'image' | 'video'; value: string; fileId?: string; }
interface VideoJob {
    prompt: string;
    status: 'pending' | 'error';
    operation: any;
    type: 'background' | 'viewer';
    windowId?: string;
}

const getApiErrorMessage = (error: unknown, context?: string): string => {
    const prefix = context ? `${context}. ` : '';
    let reason = '';
    
    if (typeof error === 'object' && error !== null) {
        const errorAsAny = error as any;
        if (errorAsAny?.error?.status === 'RESOURCE_EXHAUSTED') {
            const message = errorAsAny.error.message || 'Your API quota has been exceeded.';
            reason = `Error: ${message}. This is a limit on the free tier. Please check your Google AI Studio project settings or try again later.`;
            return prefix + reason;
        }
    }

    const errorMessage = (error instanceof Error) ? error.message : String(error);
    if (errorMessage.includes('quota exceeded') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        reason = 'Error: The Gemini API quota has been exceeded. This is a limit on the free tier. Please check your Google AI Studio project settings or try again later.';
        return prefix + reason;
    }

    reason = 'An unexpected error occurred. Please check the console for details.';
    return prefix + reason;
};


const App: React.FC = () => {
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: MessageSender.SYSTEM, text: 'ZX STUDIO Initialized. Try "create a note for my meeting" or "change cursor to a small flame".' },
        { id: 'quota-info', sender: MessageSender.SYSTEM, text: 'Welcome to ZX STUDIO. As a free tier user, please be aware there are limits on AI generation. If you exceed your quota, features like image and video generation will be temporarily unavailable. You can monitor your usage in your Google AI Studio account.' }
    ]);
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const [customApps, setCustomApps] = useState<CustomApp[]>([]);
    const [vfsFiles, setVfsFiles] = useState<VFSFile[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [theme, setTheme] = useState<Theme>({ backgroundColor: '#0f172a', textColor: '#e0f2fe', primaryColor: '#22d3ee' });
    const [backgroundContent, setBackgroundContent] = useState<Background>({ type: 'color', value: '#0f172a' });
    const [cursorSvg, setCursorSvg] = useState<string | null>(null);
    const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(false);
    const [videoGenerationJobs, setVideoGenerationJobs] = useState<{ [key: string]: VideoJob }>({});
    const [editingApp, setEditingApp] = useState<CustomApp | null>(null);
    const [versionHistoryApp, setVersionHistoryApp] = useState<CustomApp | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [savedWallpapers, setSavedWallpapers] = useState<SavedWallpaper[]>([]);
    const agentChatRef = useRef<Chat | null>(null);
    
    const windowsRef = useRef(windows);
    useEffect(() => { windowsRef.current = windows; }, [windows]);

    const handleSetBackground = useCallback((file: VFSFile) => {
        if (file.type.startsWith('image/')) {
            setBackgroundContent({ type: 'image', value: file.url, fileId: file.id });
        } else if (file.type.startsWith('video/')) {
            setBackgroundContent({ type: 'video', value: file.url, fileId: file.id });
        }
    }, []);

    const handleDeleteFile = useCallback(async (fileId: string) => {
        setVfsFiles(prev => {
            const fileToDelete = prev.find(f => f.id === fileId);
            if (fileToDelete) {
                URL.revokeObjectURL(fileToDelete.url);
            }
            return prev.filter(f => f.id !== fileId);
        });
        try {
            await storage.deleteVfsFile(fileId);
            addMessage(MessageSender.SYSTEM, "File deleted.");
        } catch (error) {
            console.error("Failed to delete file:", error);
            addMessage(MessageSender.SYSTEM, "Error deleting file from storage.");
        }
    }, []);
    
    const addMessage = (sender: MessageSender, text: string, component?: React.ReactNode) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, component }]);
    };
    
    const calculateNewWindowPosition = (existingWindows: WindowInstance[], newWindowSize: { width: number, height: number }): { x: number; y: number } => {
        const nonChatWindowsCount = existingWindows.length;
        const offset = 30;
        const cascadeIndex = nonChatWindowsCount % 10;
        
        let x = 100 + cascadeIndex * offset;
        let y = 50 + cascadeIndex * offset;
    
        const desktopHeight = window.innerHeight - TASKBAR_HEIGHT;
    
        if (x + newWindowSize.width > window.innerWidth) {
            x = window.innerWidth - newWindowSize.width - 20;
        }
        if (y + newWindowSize.height > desktopHeight) {
            y = desktopHeight - newWindowSize.height - 20;
        }
    
        return { x: Math.max(20, x), y: Math.max(20, y) };
    };

    const bringToFront = (id: string) => {
        setWindows(prev => {
            const windowToMove = prev.find(w => w.id === id);
            if (!windowToMove) return prev;
            return [...prev.filter(w => w.id !== id), windowToMove];
        });
    };

    const addWindow = useCallback((appType: AppType, title: string, content: any, size = { width: 500, height: 400 }): string => {
        const newWindow: WindowInstance = {
            id: `${appType}-${Date.now()}`, appType, title, content,
            position: calculateNewWindowPosition(windowsRef.current, size),
            size, state: WindowState.NORMAL,
        };
        setWindows(prev => [...prev, newWindow]);
        bringToFront(newWindow.id);
        return newWindow.id;
    }, []);


    useEffect(() => {
        const initialize = async () => {
            try {
                const [savedState, savedFiles] = await Promise.all([
                    storage.loadOsState(),
                    storage.loadAllVfsFiles()
                ]);

                if (savedFiles) setVfsFiles(savedFiles);

                if (savedState) {
                    setCustomApps(savedState.customApps || []);
                    setTheme(savedState.theme || { backgroundColor: '#0f172a', textColor: '#e0f2fe', primaryColor: '#22d3ee' });
                    setCursorSvg(savedState.cursorSvg || null);
                    setAgents(savedState.agents || []);
                    setProjects(savedState.projects || []);
                    setSavedWallpapers(savedState.savedWallpapers || []);
                    
                    let bgContent = savedState.backgroundContent || { type: 'color', value: '#0f172a' };
                    if (bgContent.fileId && savedFiles) {
                        const bgFile = savedFiles.find(f => f.id === bgContent.fileId);
                        bgContent.value = bgFile ? bgFile.url : savedState.theme?.backgroundColor || '#0f172a';
                        bgContent.type = bgFile ? (bgFile.type.startsWith('video/') ? 'video' : 'image') : 'color';
                    }
                    setBackgroundContent(bgContent);

                    let otherWindows = (savedState.windows || [])
                        .map((win: WindowInstance) => {
                             if (win.appType === AppType.FILE_MANAGER) {
                                return { ...win, content: { ...win.content, onSetBackground: handleSetBackground, onDeleteFile: handleDeleteFile } };
                            }
                            if (win.appType === AppType.AGENT_MANAGER) {
                                return { ...win, content: { ...win.content, onAgentsChange: setAgents } };
                            }
                            return win;
                        });
                     setWindows(otherWindows);

                }
            } catch (error) {
                console.error("Error loading initial state:", error);
            } finally {
                setIsAppLoading(false);
                setChat(startChat());
                agentChatRef.current = startChat();
            }
        };

        initialize();
    }, [handleSetBackground, handleDeleteFile]);
    
    useEffect(() => {
        if (isAppLoading) return;
        
        const bgContentForStorage = {
            ...backgroundContent,
            value: backgroundContent.type === 'color' ? backgroundContent.value : ''
        };
        
        const serializableWindows = windows.map(win => {
             if (win.appType === AppType.FILE_MANAGER || win.appType === AppType.AGENT_MANAGER || win.appType === AppType.APP_BUILDER || win.appType === AppType.WALLPAPER_MANAGER) {
                const { content, ...rest } = win;
                const newContent = { ...content };
                // Remove non-serializable parts from content
                Object.keys(newContent).forEach(key => {
                    if (typeof newContent[key] === 'function') {
                        delete newContent[key];
                    }
                });
                return { ...rest, content: newContent };
            }
            return win;
        });

        const stateToSave = {
            windows: serializableWindows,
            customApps,
            theme,
            backgroundContent: bgContentForStorage,
            cursorSvg,
            agents,
            projects,
            savedWallpapers,
        };
        storage.saveOsState(stateToSave).catch(err => {
            console.error("Failed to save OS state:", err);
        });
    }, [windows, customApps, theme, backgroundContent, cursorSvg, isAppLoading, agents, projects, savedWallpapers]);

     useEffect(() => {
        setWindows(prev => prev.map(win => {
            if (win.appType === AppType.AGENT_MANAGER) {
                return { ...win, content: { ...win.content, agents, onAgentsChange: setAgents } };
            }
            return win;
        }));
    }, [agents]);
    
    useEffect(() => {
        setWindows(prev => prev.map(win => {
            if (win.appType === AppType.APP_BUILDER) {
                return { ...win, content: { ...win.content, projects, onProjectsChange: setProjects } };
            }
            return win;
        }));
    }, [projects]);

    // Agent Scheduler
    useEffect(() => {
        const runAgent = async (agent: Agent) => {
            if (!agentChatRef.current) return;
            console.log(`Running agent: ${agent.name}`);
            setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, lastRun: Date.now() } : a));
            try {
                const results = await processCommand(agent.prompt, agentChatRef.current);
                // Process results silently (no AI message in main chat)
                for (const action of results) {
                    switch(action.type) {
                        case 'app':
                            addWindow(action.appType, action.title, action.content, action.size);
                            break;
                    }
                }
            } catch (error) {
                console.error(`Agent "${agent.name}" failed:`, error);
                addMessage(MessageSender.SYSTEM, `Agent "${agent.name}" encountered an error.`);
            }
        };

        const interval = setInterval(() => {
            const now = Date.now();
            agents.forEach(agent => {
                if (!agent.isEnabled || !agent.schedule) return;
                
                const value = parseInt(agent.schedule.slice(0, -1));
                const unit = agent.schedule.slice(-1);

                if (isNaN(value)) return;

                let intervalMs = 0;
                if (unit === 'm') intervalMs = value * 60 * 1000;
                else if (unit === 'h') intervalMs = value * 60 * 60 * 1000;
                else if (unit === 'd') intervalMs = value * 24 * 60 * 60 * 1000;
                else return;

                if (now - agent.lastRun > intervalMs) {
                    runAgent(agent);
                }
            });
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [agents, addWindow]);


    const hexToRgb = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
    };

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--background-color', theme.backgroundColor);
        root.style.setProperty('--background-rgb', hexToRgb(theme.backgroundColor));
        root.style.setProperty('--text-color', theme.textColor);
        root.style.setProperty('--text-rgb', hexToRgb(theme.textColor));
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--primary-rgb', hexToRgb(theme.primaryColor));
        if (backgroundContent.type === 'color') {
            setBackgroundContent(bg => ({ ...bg, value: theme.backgroundColor }));
        }
    }, [theme, backgroundContent.type]);

    useEffect(() => {
        let styleElement = document.getElementById('custom-cursor-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'custom-cursor-style';
            document.head.appendChild(styleElement);
        }
        if (cursorSvg) {
            const encodedSvg = encodeURIComponent(cursorSvg).replace(/'/g, '%27').replace(/"/g, '%22');
            styleElement.innerHTML = `.custom-cursor { cursor: url("data:image/svg+xml,${encodedSvg}"), auto; }`;
        } else {
            styleElement.innerHTML = '';
        }
    }, [cursorSvg]);

    useEffect(() => {
        if (!isTtsEnabled) {
            window.speechSynthesis.cancel();
            return;
        };
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.sender === MessageSender.AI && lastMessage.text) {
            const utterance = new SpeechSynthesisUtterance(lastMessage.text);
            window.speechSynthesis.speak(utterance);
        }
    }, [messages, isTtsEnabled]);

     const updateWindow = (id: string, updates: Partial<WindowInstance>) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    };

    const handleWindowContentChange = (id: string, newContent: any) => {
        // Check for the specific object structure sent on drag end to update position.
        // This prevents the entire window instance from being nested inside the 'content' property.
        if (typeof newContent === 'object' && newContent !== null && newContent.id === id && newContent.appType && newContent.position) {
            updateWindow(id, { position: newContent.position });
        } else {
            updateWindow(id, { content: newContent });
        }
    };

    useEffect(() => {
        const pendingJobs = Object.keys(videoGenerationJobs).filter(
            (id) => videoGenerationJobs[id].status === 'pending'
        );
        if (pendingJobs.length === 0) return;

        const interval = setInterval(() => {
            pendingJobs.forEach(async (jobId) => {
                const job = videoGenerationJobs[jobId];
                if (!job || !job.operation) return;

                try {
                    let result = await getVideosOperation(job.operation);

                    if (result.done) {
                        const downloadLink = result.response?.generatedVideos?.[0]?.video?.uri;
                        if (downloadLink) {
                            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                            const videoBlob = await response.blob();
                            const videoUrl = URL.createObjectURL(videoBlob);
                            
                            if (job.type === 'background') {
                                const videoFile: VFSFile = { id: `vfs-${Date.now()}`, name: `${job.prompt.substring(0, 20)}.mp4`, type: 'video/mp4', url: videoUrl, blob: videoBlob };
                                await storage.saveVfsFile(videoFile);
                                setVfsFiles(prev => [...prev, videoFile]);

                                const newWallpaper: SavedWallpaper = {
                                    id: `wp-${Date.now()}`, prompt: job.prompt, type: 'video',
                                    url: videoFile.url, fileId: videoFile.id,
                                };
                                setSavedWallpapers(prev => [...prev, newWallpaper]);

                                setBackgroundContent({ type: 'video', value: videoFile.url, fileId: videoFile.id });
                                addMessage(MessageSender.SYSTEM, `Video background "${job.prompt}" finished, applied, and saved to Wallpapers.`);
                            } else if (job.type === 'viewer' && job.windowId) {
                                updateWindow(job.windowId, { content: { prompt: job.prompt, imageUrl: videoUrl, status: 'success' } });
                            }
                        }
                        setVideoGenerationJobs(prev => {
                            const newJobs = { ...prev };
                            delete newJobs[jobId];
                            return newJobs;
                        });
                    } else {
                        setVideoGenerationJobs(prev => ({ ...prev, [jobId]: { ...job, operation: result } }));
                    }
                } catch (error) {
                    console.error('Video generation polling error:', error);
                    const friendlyMessage = getApiErrorMessage(error, `Video generation failed for "${job.prompt}"`);
                    addMessage(MessageSender.SYSTEM, friendlyMessage);
                    if (job.type === 'viewer' && job.windowId) {
                        updateWindow(job.windowId, { content: { ...job, status: 'error' } });
                    }
                    setVideoGenerationJobs(prev => ({...prev, [jobId]: {...job, status: 'error', operation: null}}));
                }
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [videoGenerationJobs]);
    
    const closeWindow = (id: string) => setWindows(prev => prev.filter(w => w.id !== id));
    
    const minimizeWindow = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, state: WindowState.MINIMIZED } : w));

    const toggleMaximizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, state: w.state === WindowState.MAXIMIZED ? WindowState.NORMAL : WindowState.MAXIMIZED } : w));
        bringToFront(id);
    };

    const handleTaskbarClick = (id: string) => {
        const windowInstance = windows.find(w => w.id === id);
        if (!windowInstance) return;

        const isTopWindow = windows[windows.length - 1].id === id;
        if (windowInstance.state === WindowState.MINIMIZED) {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, state: WindowState.NORMAL } : w));
            bringToFront(id);
        } else if (isTopWindow) {
            minimizeWindow(id);
        } else {
            bringToFront(id);
        }
    };
    
    const handleLaunchApp = (app: CustomApp) => {
        const activeVersion = app.versions.find(v => v.versionId === app.activeVersionId);
        if (activeVersion) {
            addWindow(
                AppType.HTML_APP,
                app.name,
                { htmlContent: activeVersion.htmlContent, customAppId: app.id },
                { width: 600, height: 450 }
            );
        }
    };

    const handleEditApp = (appId: string) => {
        const appToEdit = customApps.find(app => app.id === appId);
        if (appToEdit) setEditingApp(appToEdit);
    };

    const handleShowVersions = (appId: string) => {
        const appToShow = customApps.find(app => app.id === appId);
        if (appToShow) setVersionHistoryApp(appToShow);
    };
    
    const handleSaveApp = async (appId: string, newName: string, newIconPrompt: string) => {
        setCustomApps(prev => prev.map(app => app.id === appId ? { ...app, name: newName } : app));
        if (newIconPrompt) {
            addMessage(MessageSender.SYSTEM, `Generating new icon for "${newName}"...`);
            try {
                const iconSvg = await generateIconApi(newIconPrompt);
                setCustomApps(prev => prev.map(app => {
                    if (app.id === appId) {
                        const activeVersion = app.versions.find(v => v.versionId === app.activeVersionId);
                        if (activeVersion) {
                            activeVersion.icon = iconSvg;
                        }
                    }
                    return app;
                }));
                 addMessage(MessageSender.SYSTEM, "Icon updated.");
            } catch (error) {
                const friendlyMessage = getApiErrorMessage(error, `Failed to generate new icon for "${newName}"`);
                addMessage(MessageSender.SYSTEM, friendlyMessage);
            }
        }
    };
    
    const handleRevertAppVersion = (appId: string, versionId: string) => {
        setCustomApps(prev => prev.map(app => app.id === appId ? { ...app, activeVersionId: versionId } : app));
    };
    
    const getActiveVersion = (app: CustomApp): AppVersion | undefined => {
        return app.versions.find(v => v.versionId === app.activeVersionId);
    };

    const handleFileImport = async (files: FileList) => {
        const newVfsFiles: VFSFile[] = Array.from(files).map(file => ({
            id: `vfs-${Date.now()}-${file.name}`,
            name: file.name, type: file.type, url: URL.createObjectURL(file), blob: file
        }));
        try {
            await Promise.all(newVfsFiles.map(file => storage.saveVfsFile(file)));
            setVfsFiles(prev => [...prev, ...newVfsFiles]);
        } catch (error) {
            console.error("Failed to save imported files:", error);
            addMessage(MessageSender.SYSTEM, "Error importing files. They may not persist.");
        }
    };

    const handleLaunchWebBrowser = () => {
        addWindow(AppType.WEB_BROWSER, "Web Browser", {}, { width: 1024, height: 768 });
    };

    const handleInstallProject = async (project: Project) => {
        const htmlFile = project.files.find(f => f.type === 'html');
        if (!htmlFile) {
            addMessage(MessageSender.SYSTEM, `Project "${project.name}" cannot be installed without an index.html file.`);
            return;
        }

        const cssFile = project.files.find(f => f.type === 'css');
        const jsFile = project.files.find(f => f.type === 'js');
        
        let compiledHtml = htmlFile.content;
        if (cssFile) {
             compiledHtml = compiledHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
        }
        if (jsFile) {
            compiledHtml = compiledHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
        }
        
        const newApp: CustomApp = {
            id: `app-${Date.now()}`,
            name: project.name,
            versions: [{
                versionId: `v-${Date.now()}`,
                createdAt: Date.now(),
                icon: project.icon,
                htmlContent: compiledHtml
            }],
            activeVersionId: `v-${Date.now()}`
        };
        
        setCustomApps(prev => [...prev, newApp]);
        handleLaunchApp(newApp);
        addMessage(MessageSender.SYSTEM, `Successfully installed and launched "${project.name}".`);
    };

    const handleLaunchAppBuilder = () => {
        addWindow(
            AppType.APP_BUILDER,
            "App Studio",
            {
                projects,
                onProjectsChange: setProjects,
                onInstall: handleInstallProject,
                getAiCodeHelp: getAiCodeHelp,
                generateIcon: generateIconApi,
            },
            { width: 1200, height: 800 }
        );
    };

    const handleDeleteWallpaper = useCallback(async (wallpaperId: string) => {
        const wallpaperToDelete = savedWallpapers.find(wp => wp.id === wallpaperId);
        if (!wallpaperToDelete) return;

        setSavedWallpapers(prev => prev.filter(wp => wp.id !== wallpaperId));
        await handleDeleteFile(wallpaperToDelete.fileId);

        addMessage(MessageSender.SYSTEM, "Wallpaper deleted.");
    }, [savedWallpapers, handleDeleteFile]);

    const handleDownloadWallpaper = useCallback((wallpaper: SavedWallpaper) => {
        const fileToDownload = vfsFiles.find(f => f.id === wallpaper.fileId);
        if (!fileToDownload) {
            addMessage(MessageSender.SYSTEM, "Could not find file to download.");
            return;
        }
        const link = document.createElement('a');
        link.href = fileToDownload.url;
        link.download = fileToDownload.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [vfsFiles]);

    const handleLaunchWallpaperManager = () => {
        addWindow(
            AppType.WALLPAPER_MANAGER, "Wallpapers",
            {
                wallpapers: savedWallpapers,
                vfsFiles: vfsFiles,
                onSetWallpaper: handleSetBackground,
                onDeleteWallpaper: handleDeleteWallpaper,
                onDownloadWallpaper: handleDownloadWallpaper,
            },
            { width: 800, height: 600 }
        );
    };

    const handleCommandSubmit = useCallback(async (command: string) => {
        if (!command.trim() || isLoading || !chat) return;
        addMessage(MessageSender.USER, command);
        setIsLoading(true);

        try {
            const results: any[] = await processCommand(command, chat);

            for (const result of results) {
                if (result.message) addMessage(MessageSender.AI, result.message);

                switch(result.type) {
                    case 'app':
                        addWindow(result.appType, result.title, result.content, result.size);
                        break;
                    case 'html_app_create':
                        const newApp: CustomApp = {
                            id: `app-${Date.now()}`, name: result.name,
                            versions: [{ versionId: `v-${Date.now()}`, createdAt: Date.now(), icon: result.icon, htmlContent: result.htmlContent }],
                            activeVersionId: `v-${Date.now()}`
                        };
                        setCustomApps(prev => [...prev, newApp]);
                        handleLaunchApp(newApp);
                        break;
                     case 'html_app_modify_request': {
                        const { appName, modificationRequest } = result;
                        const appToModify = customApps.find(app => app.name.toLowerCase() === appName.toLowerCase());
                        if (!appToModify) {
                            addMessage(MessageSender.SYSTEM, `Could not find an app named "${appName}".`);
                            break;
                        }
                        const activeVersion = appToModify.versions.find(v => v.versionId === appToModify.activeVersionId);
                        if (!activeVersion) {
                            addMessage(MessageSender.SYSTEM, `Could not find an active version for "${appName}".`);
                            break;
                        }
                        
                        addMessage(MessageSender.SYSTEM, `Modifying "${appName}"...`);
                        try {
                            const newHtmlContent = await getModifiedHtml(activeVersion.htmlContent, modificationRequest);
                            const newVersion: AppVersion = {
                                versionId: `v-${Date.now()}`,
                                createdAt: Date.now(),
                                icon: activeVersion.icon,
                                htmlContent: newHtmlContent,
                            };
                            
                            setCustomApps(prev => prev.map(app => {
                                if (app.id === appToModify.id) {
                                    return {
                                        ...app,
                                        versions: [...app.versions, newVersion],
                                        activeVersionId: newVersion.versionId,
                                    };
                                }
                                return app;
                            }));
                            
                            addMessage(MessageSender.SYSTEM, `Successfully updated "${appName}". A new version has been created.`);
                        } catch (error) {
                            const friendlyMessage = getApiErrorMessage(error, `Failed to modify "${appName}"`);
                            addMessage(MessageSender.SYSTEM, friendlyMessage);
                        }
                        break;
                    }
                    case 'html_app_uninstall':
                        setCustomApps(prev => {
                            const appToUninstall = prev.find(app => app.name.toLowerCase() === result.appName.toLowerCase());
                            if (appToUninstall) {
                                setWindows(currentWindows => currentWindows.filter(win => 
                                    !(win.appType === AppType.HTML_APP && win.content.customAppId === appToUninstall.id)
                                ));
                            }
                            return prev.filter(app => app.name.toLowerCase() !== result.appName.toLowerCase());
                        });
                        break;
                    case 'theme_change': setTheme(result.theme); break;
                    
                    case 'background_generation_start': {
                        const { prompt } = result;
                        addMessage(MessageSender.SYSTEM, `Generating background image: "${prompt}"...`);
                        
                        const dataURLtoBlob = (dataurl: string): Blob => {
                            const arr = dataurl.split(',');
                            const mimeMatch = arr[0].match(/:(.*?);/);
                            if (!mimeMatch) throw new Error("Invalid data URL");
                            const mime = mimeMatch[1];
                            const bstr = atob(arr[1]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                            return new Blob([u8arr], { type: mime });
                        };

                        const imageUrl = await generateImageFromApi(prompt, '16:9');
                        const imageBlob = dataURLtoBlob(imageUrl);
                        const fileId = `vfs-${Date.now()}`;
                        const newFile: VFSFile = {
                            id: fileId, name: `${prompt.substring(0, 20)}.jpg`, type: 'image/jpeg',
                            url: URL.createObjectURL(imageBlob), blob: imageBlob
                        };
                        
                        await storage.saveVfsFile(newFile);
                        setVfsFiles(prev => [...prev, newFile]);

                        const newWallpaper: SavedWallpaper = {
                            id: `wp-${Date.now()}`, prompt: prompt, type: 'image',
                            url: newFile.url, fileId: newFile.id,
                        };
                        setSavedWallpapers(prev => [...prev, newWallpaper]);

                        setBackgroundContent({ type: 'image', value: newFile.url, fileId: newFile.id });
                        addMessage(MessageSender.SYSTEM, `Background updated and saved to Wallpapers.`);
                        break;
                    }
                    
                    case 'image_generation_start': {
                        const { prompt } = result;
                        const windowId = addWindow(AppType.IMAGE_GENERATOR, `Image: ${prompt.substring(0, 20)}...`, { prompt, status: 'generating' }, { width: 512, height: 512 });
                        try {
                            const imageUrl = await generateImageFromApi(prompt, '1:1');
                            updateWindow(windowId, { content: { prompt, imageUrl, status: 'success' } });
                        } catch (e) {
                             updateWindow(windowId, { content: { prompt, status: 'error' } });
                            throw e;
                        }
                        break;
                    }
                    
                    case 'video_generation_start': {
                        const { prompt, operation } = result;
                        const windowId = addWindow(AppType.VIDEO_GENERATOR, `Video: ${prompt.substring(0, 20)}...`, { prompt, status: 'generating' }, { width: 512, height: 512 });
                        const jobId = `video-job-${Date.now()}`;
                        setVideoGenerationJobs(prev => ({ ...prev, [jobId]: { prompt, status: 'pending', operation, type: 'viewer', windowId }}));
                        break;
                    }
                    
                    case 'cursor_change': setCursorSvg(result.svg); break;
                    
                    case 'video_background_generation_start': {
                        const jobId = `video-job-${Date.now()}`;
                        const newJob: VideoJob = {
                            prompt: result.prompt,
                            status: 'pending',
                            operation: result.operation,
                            type: 'background'
                        };
                        setVideoGenerationJobs(prev => ({ ...prev, [jobId]: newJob }));
                        break;
                    }
                    
                    case 'agent_create':
                        setAgents(prev => [...prev, result.agent]);
                        addWindow(AppType.AGENT_MANAGER, "Agent Manager", { agents: [...agents, result.agent], onAgentsChange: setAgents }, { width: 700, height: 500 });
                        break;
                }
            }
        } catch (error) {
            console.error('Error processing command:', error);
            const friendlyMessage = getApiErrorMessage(error);
            addMessage(MessageSender.SYSTEM, friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, addWindow, customApps, chat, agents, projects, savedWallpapers]);
    
    if (isAppLoading) {
        return (
            <main className="h-screen w-screen flex items-center justify-center" style={{backgroundColor: '#0f172a'}}>
                <LoadingSpinner />
            </main>
        );
    }
    
    const activeVideoJobs = Object.values(videoGenerationJobs).filter((job: VideoJob) => job.status === 'pending');

    return (
        <main className={`h-screen w-screen overflow-hidden flex flex-col bg-cover bg-center transition-all duration-500 ${cursorSvg ? 'custom-cursor' : ''}`}>
            {backgroundContent.type === 'video' && (
                <video src={backgroundContent.value} autoPlay loop muted className="absolute top-0 left-0 w-full h-full object-cover -z-10" />
            )}
            <div 
                className="absolute top-0 left-0 w-full h-full -z-10 bg-cover bg-center"
                style={{
                    backgroundColor: backgroundContent.type === 'color' ? backgroundContent.value : 'transparent',
                    backgroundImage: backgroundContent.type === 'image' ? `url(${backgroundContent.value})` : 'none',
                }}
            />

            <Desktop 
                messages={messages} windows={windows} customApps={customApps} vfsFiles={vfsFiles}
                closeWindow={closeWindow} bringToFront={bringToFront} 
                minimizeWindow={minimizeWindow} toggleMaximizeWindow={toggleMaximizeWindow}
                onWindowContentChange={handleWindowContentChange}
                onLaunchApp={handleLaunchApp} onEditApp={handleEditApp} onShowVersions={handleShowVersions}
                onLaunchFileManager={() => addWindow(AppType.FILE_MANAGER, "File Manager", { onSetBackground: handleSetBackground, onDeleteFile: handleDeleteFile }, { width: 700, height: 500 })}
                onLaunchWebBrowser={handleLaunchWebBrowser}
                onLaunchAgentManager={() => addWindow(AppType.AGENT_MANAGER, "Agent Manager", { agents, onAgentsChange: setAgents }, { width: 700, height: 500 })}
                onLaunchAppBuilder={handleLaunchAppBuilder}
                onLaunchWallpaperManager={handleLaunchWallpaperManager}
            />
            <VoiceOrb onCommandSubmit={handleCommandSubmit} isLoading={isLoading} />
            
            {isCommandCenterOpen && (
                <CommandCenter 
                    messages={messages}
                    onCommandSubmit={handleCommandSubmit}
                    isLoading={isLoading}
                />
            )}

            <Taskbar 
                windows={windows}
                onTaskbarItemClick={handleTaskbarClick} 
                isTtsEnabled={isTtsEnabled}
                onToggleTts={() => setIsTtsEnabled(prev => !prev)}
                onFileImport={handleFileImport}
                isCommandCenterOpen={isCommandCenterOpen}
                onToggleCommandCenter={() => setIsCommandCenterOpen(prev => !prev)}
            />
            <div className="absolute bottom-20 right-4 space-y-2">
              {activeVideoJobs.map((job: VideoJob) => job.type === 'background' && <VideoGenerationToast key={job.operation?.name} prompt={job.prompt} /> )}
            </div>

            {editingApp && <EditAppModal app={editingApp} onClose={() => setEditingApp(null)} onSave={handleSaveApp} />}
            {versionHistoryApp && <VersionHistoryModal app={versionHistoryApp} onClose={() => setVersionHistoryApp(null)} onRevert={handleRevertAppVersion} getActiveVersion={getActiveVersion} />}
        </main>
    );
};

export default App;