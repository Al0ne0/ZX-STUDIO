import { ReactNode } from 'react';

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  component?: ReactNode;
}

export enum AppType {
  NOTEPAD = 'NOTEPAD',
  WEB_SEARCH = 'WEB_SEARCH',
  SYSTEM_STATUS = 'SYSTEM_STATUS',
  MEDIA_VIEWER = 'MEDIA_VIEWER',
  FILE_MANAGER = 'FILE_MANAGER',
  HTML_APP = 'HTML_APP',
  IMAGE_GENERATOR = 'IMAGE_GENERATOR',
  VIDEO_GENERATOR = 'VIDEO_GENERATOR',
  WEB_BROWSER = 'WEB_BROWSER',
  AGENT_MANAGER = 'AGENT_MANAGER',
  APP_BUILDER = 'APP_BUILDER',
  WALLPAPER_MANAGER = 'WALLPAPER_MANAGER',
}

export enum WindowState {
  NORMAL = 'NORMAL',
  MINIMIZED = 'MINIMIZED',
  MAXIMIZED = 'MAXIMIZED',
}

export interface WindowInstance {
  id: string;
  appType: AppType;
  title: string;
  content: any;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  state: WindowState;
  isClosable?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  isMaximizable?: boolean;
}

export interface VFSFile {
    id: string;
    name: string;
    type: string; // MIME type
    url: string; // Object URL
    blob: Blob;
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface AppVersion {
  versionId: string;
  createdAt: number;
  icon: string;
  htmlContent: string;
}

export interface CustomApp {
  id: string;
  name: string;
  versions: AppVersion[];
  activeVersionId: string;
}

// Fix: Add Project and ProjectFile interfaces for the App Builder feature.
export interface ProjectFile {
    id: string;
    name: string;
    type: 'html' | 'css' | 'js';
    content: string;
}

export interface Project {
    id: string;
    name: string;
    icon: string;
    files: ProjectFile[];
}

export enum AgentTrigger {
    SCHEDULE = 'SCHEDULE',
}

export interface Agent {
    id: string;
    name: string;
    prompt: string;
    trigger: AgentTrigger;
    schedule: string; // "10m", "1h", "1d"
    lastRun: number;
    isEnabled: boolean;
}

export interface SavedWallpaper {
  id: string;
  prompt: string;
  type: 'image' | 'video';
  url: string;
  fileId: string;
}
