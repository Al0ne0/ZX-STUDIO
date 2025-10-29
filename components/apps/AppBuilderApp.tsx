import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Project, ProjectFile } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { ICONS } from '../../constants';

interface AppBuilderAppProps {
    projects: Project[];
    onProjectsChange: (projects: Project[]) => void;
    onInstall: (project: Project) => void;
    getAiCodeHelp: (codeContext: string, prompt: string) => Promise<string>;
    generateIcon: (prompt: string) => Promise<string>;
}

const CreateProjectModal: React.FC<{
    onClose: () => void;
    onCreate: (name: string) => void;
}> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');

    const handleSubmit = () => {
        if (name.trim()) {
            onCreate(name.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="p-6 rounded-lg shadow-2xl w-full max-w-md border"
                style={{ backgroundColor: 'rgba(var(--background-rgb), 0.9)', borderColor: 'rgba(var(--primary-rgb), 0.3)'}}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--primary-color)' }}>Create New Project</h2>
                <div>
                    <label className="block text-sm font-medium mb-1">Project Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="w-full bg-slate-700 rounded px-3 py-2 text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded" style={{backgroundColor: 'rgba(var(--text-rgb), 0.1)'}}>Cancel</button>
                    <button onClick={handleSubmit} disabled={!name.trim()} className="px-4 py-2 rounded disabled:opacity-50" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-color)' }}>Create</button>
                </div>
            </div>
        </div>
    );
};

const EditProjectModal: React.FC<{
    project: Project;
    onClose: () => void;
    onSave: (newName: string) => void;
    onGenerateIcon: (prompt: string) => Promise<void>;
}> = ({ project, onClose, onSave, onGenerateIcon }) => {
    const [name, setName] = useState(project.name);
    const [iconPrompt, setIconPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!iconPrompt.trim()) return;
        setIsGenerating(true);
        await onGenerateIcon(iconPrompt);
        setIsGenerating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="p-6 rounded-lg shadow-2xl w-full max-w-md border"
                style={{ backgroundColor: 'rgba(var(--background-rgb), 0.9)', borderColor: 'rgba(var(--primary-rgb), 0.3)'}}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--primary-color)' }}>Edit Project</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Project Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 rounded px-3 py-2 text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Generate New Icon</label>
                        <div className="flex gap-2">
                            <input type="text" value={iconPrompt} onChange={(e) => setIconPrompt(e.target.value)} placeholder="e.g., a smiling sun" className="flex-grow bg-slate-700 rounded px-3 py-2 text-sm"/>
                            <button onClick={handleGenerate} disabled={isGenerating || !iconPrompt.trim()} className="px-4 py-2 rounded text-sm disabled:opacity-50 flex items-center justify-center w-24" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-color)' }}>
                                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[var(--background-color)]"></div> : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded" style={{backgroundColor: 'rgba(var(--text-rgb), 0.1)'}}>Cancel</button>
                    <button onClick={() => { onSave(name); onClose(); }} className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-color)' }}>Save</button>
                </div>
            </div>
        </div>
    );
};

const CodeEditor: React.FC<{file: ProjectFile, onChange: (content: string) => void}> = ({ file, onChange }) => {
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const lineCount = useMemo(() => (file.content.match(/\n/g) || []).length + 1, [file.content]);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    return (
        <div className="flex h-full w-full bg-slate-950 text-cyan-300 font-mono text-xs rounded-sm">
            <div ref={lineNumbersRef} className="p-2 text-right bg-slate-800 text-slate-500 overflow-hidden select-none font-mono">
                {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
                ref={textareaRef}
                onScroll={handleScroll}
                value={file.content}
                onChange={(e) => onChange(e.target.value)}
                className="flex-grow w-full h-full bg-transparent p-2 resize-none focus:outline-none leading-normal"
                spellCheck="false"
            />
        </div>
    );
};

const AppBuilderApp: React.FC<AppBuilderAppProps> = ({ projects, onProjectsChange, onInstall, getAiCodeHelp, generateIcon }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [aiHelpQuery, setAiHelpQuery] = useState('');
    const [aiHelpResponse, setAiHelpResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // UI State
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [editorPanelHeight, setEditorPanelHeight] = useState(350);
    const [activeBottomTab, setActiveBottomTab] = useState<'preview' | 'ai'>('preview');
    const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
    const [resizing, setResizing] = useState<'sidebar' | 'editor' | null>(null);

    const mainPanelRef = useRef<HTMLDivElement>(null);

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
    const selectedFile = useMemo(() => selectedProject?.files.find(f => f.id === selectedFileId), [selectedProject, selectedFileId]);

    // Project and file selection logic
    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
    }, [projects, selectedProjectId]);
    
    useEffect(() => {
        if (selectedProject && (!selectedFileId || !selectedProject.files.some(f => f.id === selectedFileId))) {
            setSelectedFileId(selectedProject.files.find(f => f.type === 'html')?.id || selectedProject.files[0]?.id || null);
        }
    }, [selectedProject, selectedFileId]);

    // Panel resizing logic
    const handleResize = useCallback((e: MouseEvent) => {
        if (resizing === 'sidebar') {
            setSidebarWidth(prev => Math.max(200, Math.min(e.clientX - (mainPanelRef.current?.getBoundingClientRect().left || 0), 500)));
        } else if (resizing === 'editor' && mainPanelRef.current) {
            const mainPanelRect = mainPanelRef.current.getBoundingClientRect();
            const newHeight = e.clientY - mainPanelRect.top;
            setEditorPanelHeight(Math.max(100, Math.min(newHeight, mainPanelRect.height - 100)));
        }
    }, [resizing]);

    const stopResizing = useCallback(() => setResizing(null), []);

    useEffect(() => {
        if (resizing) {
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('mouseup', stopResizing, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resizing, handleResize, stopResizing]);

    // Fullscreen preview logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsPreviewFullscreen(false); };
        if (isPreviewFullscreen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isPreviewFullscreen]);

    // Data modification functions
    const updateProject = (projectId: string, updates: Partial<Project>) => {
        onProjectsChange(projects.map(p => p.id === projectId ? { ...p, ...updates } : p));
    };

    const updateFileContent = (fileId: string, content: string) => {
        if (!selectedProjectId || !selectedProject) return;
        const updatedFiles = selectedProject.files.map(f => f.id === fileId ? { ...f, content } : f);
        updateProject(selectedProjectId, { files: updatedFiles });
    };

    const executeCreateProject = (name: string) => {
        const now = Date.now();
        const newProject: Project = {
            id: `proj-${now}`, name,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>',
            files: [
                { id: `file-${now}-html`, name: 'index.html', type: 'html', content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${name}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, ${name}!</h1>\n  <script src="script.js"></script>\n</body>\n</html>` },
                { id: `file-${now}-css`, name: 'style.css', type: 'css', content: `body {\n  font-family: sans-serif;\n  background-color: #282c34;\n  color: white;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}` },
                { id: `file-${now}-js`, name: 'script.js', type: 'js', content: `console.log("Hello from ${name}!");` }
            ]
        };
        onProjectsChange([...projects, newProject]);
        setSelectedProjectId(newProject.id);
        setSelectedFileId(newProject.files[0].id);
    };
    
    const handleDeleteProject = (projectId: string) => {
        if (window.confirm(`Are you sure you want to delete project "${projects.find(p=>p.id===projectId)?.name}"?`)) {
            const newProjects = projects.filter(p => p.id !== projectId);
            onProjectsChange(newProjects);
            if (selectedProjectId === projectId) setSelectedProjectId(newProjects[0]?.id || null);
        }
    };

    const handleAskAiHelp = async () => {
        if (!aiHelpQuery.trim() || !selectedFile) return;
        setIsAiLoading(true); setAiHelpResponse('');
        try {
            const response = await getAiCodeHelp(selectedFile.content, aiHelpQuery);
            setAiHelpResponse(response);
        } catch (error) {
            setAiHelpResponse(`Error getting help: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleApplyAiHelp = () => {
        if (aiHelpResponse && selectedFile && !aiHelpResponse.startsWith('Error')) {
            updateFileContent(selectedFile.id, aiHelpResponse);
            setAiHelpResponse(''); setAiHelpQuery('');
        }
    };

    const compilePreview = useMemo((): string => {
        if (!selectedProject) return '<html><body><p>Select a project to preview.</p></body></html>';
        const htmlFile = selectedProject.files.find(f => f.type === 'html');
        const cssFile = selectedProject.files.find(f => f.type === 'css');
        const jsFile = selectedProject.files.find(f => f.type === 'js');
        if (!htmlFile) return '<html><body><p>No HTML file found.</p></body></html>';
        
        let html = htmlFile.content;
        if (cssFile) html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
        if (jsFile) html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
        return html;
    }, [selectedProject]);

    // Render logic
    return (
        <div className="flex h-full w-full bg-slate-900 text-white font-sans text-sm select-none">
             {isCreateModalOpen && <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} onCreate={executeCreateProject} />}
             {editingProject && (
                <EditProjectModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={(newName) => updateProject(editingProject.id, { name: newName })}
                    onGenerateIcon={async (prompt) => {
                        const newIcon = await generateIcon(prompt);
                        updateProject(editingProject.id, { icon: newIcon });
                    }}
                />
            )}
            {isPreviewFullscreen && (
                <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
                    <iframe srcDoc={compilePreview} title="App Preview Fullscreen" sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0"/>
                    <button onClick={() => setIsPreviewFullscreen(false)} className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors" style={{ backgroundColor: 'rgba(var(--background-rgb), 0.7)', color: 'var(--text-color)'}}>
                        {ICONS.restore} Exit Fullscreen
                    </button>
                </div>
            )}
            
            <div className="p-2 flex flex-col border-r border-slate-700" style={{ width: `${sidebarWidth}px`}}>
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                    <h2 className="text-base font-bold">Projects</h2>
                    <button onClick={() => setIsCreateModalOpen(true)} title="New Project" className="p-1 rounded hover:bg-slate-700">{ICONS.add}</button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {projects.map(proj => (
                        <div key={proj.id} className="mb-1 rounded text-xs" style={{ backgroundColor: selectedProjectId === proj.id ? 'rgba(var(--primary-rgb), 0.2)' : 'transparent' }}>
                            <div className="flex items-center justify-between p-1.5 cursor-pointer group" onClick={() => setSelectedProjectId(proj.id)}>
                                <div className="flex items-center gap-2 truncate">
                                    <div className="w-5 h-5 flex-shrink-0" dangerouslySetInnerHTML={{__html: proj.icon}} />
                                    <span className="truncate">{proj.name}</span>
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onInstall(proj); }} title="Install App" className="p-1 rounded hover:bg-slate-700">{ICONS.upload}</button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingProject(proj); }} title="Edit Project" className="p-1 rounded hover:bg-slate-700">{ICONS.edit}</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }} title="Delete Project" className="p-1 rounded hover:bg-slate-700 text-red-400">{ICONS.uninstall}</button>
                                </div>
                            </div>
                            {selectedProjectId === proj.id && (
                                <div className="pl-4 border-l-2 ml-3 border-slate-600">
                                    {proj.files.map(file => (
                                        <div key={file.id} onClick={() => setSelectedFileId(file.id)} className="p-1.5 rounded cursor-pointer flex items-center gap-2" style={{ backgroundColor: selectedFileId === file.id ? 'rgba(var(--primary-rgb), 0.3)' : 'transparent' }}>
                                            {file.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div onMouseDown={() => setResizing('sidebar')} className="w-1.5 cursor-col-resize flex-shrink-0 bg-slate-800 hover:bg-[var(--primary-color)] transition-colors"></div>

            <div ref={mainPanelRef} className="flex-1 flex flex-col min-w-0">
                <div className="p-1 flex flex-col" style={{ height: `${editorPanelHeight}px` }}>
                     <div className="flex-shrink-0 text-xs px-2 py-1 text-slate-400 flex justify-between items-center">
                        <span className="flex items-center">{ICONS.code} {selectedFile?.name || 'No file selected'}</span>
                    </div>
                    <div className="flex-grow min-h-0">
                        {selectedFile ? (
                            <CodeEditor file={selectedFile} onChange={(content) => updateFileContent(selectedFile.id, content)} />
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-slate-400 h-full">{selectedProject ? "Select a file" : "Create or select a project"}</div>
                        )}
                    </div>
                </div>
                
                <div onMouseDown={() => setResizing('editor')} className="h-1.5 cursor-row-resize flex-shrink-0 bg-slate-800 hover:bg-[var(--primary-color)] transition-colors"></div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-shrink-0 flex items-center border-b border-slate-700 bg-slate-800">
                        <button onClick={() => setActiveBottomTab('preview')} className={`px-3 py-1.5 text-xs flex items-center gap-1 ${activeBottomTab === 'preview' ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}>Preview</button>
                        <button onClick={() => setActiveBottomTab('ai')} className={`px-3 py-1.5 text-xs flex items-center gap-1 ${activeBottomTab === 'ai' ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}>{ICONS.gemini} AI Helper</button>
                        <div className="flex-grow"></div>
                        {activeBottomTab === 'preview' && (
                             <button onClick={() => setIsPreviewFullscreen(true)} className="px-2 py-1.5 text-xs hover:bg-slate-700/50" title="Fullscreen Preview">{ICONS.fullscreen}</button>
                        )}
                    </div>
                     <div className="flex-grow bg-slate-800/50 min-h-0">
                        {activeBottomTab === 'preview' ? (
                            <div className="w-full h-full bg-white"><iframe key={selectedProject?.id} srcDoc={compilePreview} title="App Preview" sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0"/></div>
                        ) : (
                             <div className="p-2 h-full flex flex-col">
                                <div className="flex-grow bg-slate-800 rounded p-1 mb-2 flex flex-col min-h-0">
                                    {isAiLoading ? ( <div className="flex justify-center items-center h-full"><LoadingSpinner /></div> ) : (
                                        <textarea readOnly value={aiHelpResponse || 'Ask for help with your code! Example: "Add a reset button".'} className="w-full h-full bg-transparent text-slate-300 text-xs font-mono resize-none focus:outline-none p-1"/>
                                    )}
                                </div>
                                {aiHelpResponse && !aiHelpResponse.startsWith('Error') && !isAiLoading && (
                                    <div className="flex gap-2 mb-2 flex-shrink-0">
                                        <button onClick={handleApplyAiHelp} className="flex-grow px-3 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(74, 222, 128, 0.3)', color: 'rgb(134, 239, 172)'}}>Apply Change</button>
                                        <button onClick={() => {setAiHelpResponse(''); setAiHelpQuery('');}} className="px-3 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(252, 165, 165, 0.2)', color: 'rgb(252, 165, 165)'}}>Discard</button>
                                    </div>
                                )}
                                <div className="flex gap-2 flex-shrink-0">
                                    <input type="text" value={aiHelpQuery} onChange={e => setAiHelpQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAskAiHelp()} placeholder="Describe the change you want..." className="flex-grow bg-slate-700 rounded px-2 py-1 text-xs" disabled={!selectedFile || isAiLoading} />
                                    <button onClick={handleAskAiHelp} disabled={!selectedFile || isAiLoading || !aiHelpQuery.trim()} className="px-3 py-1 rounded text-xs disabled:opacity-50" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-color)'}}>Ask AI</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppBuilderApp;
