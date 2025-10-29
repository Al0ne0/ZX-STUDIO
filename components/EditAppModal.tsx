import React, { useState } from 'react';
import { CustomApp } from '../types';
import { ICONS } from '../constants';

interface EditAppModalProps {
    app: CustomApp;
    onClose: () => void;
    onSave: (appId: string, newName: string, newIconPrompt: string) => Promise<void>;
}

const EditAppModal: React.FC<EditAppModalProps> = ({ app, onClose, onSave }) => {
    const [appName, setAppName] = useState(app.name);
    const [iconPrompt, setIconPrompt] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(app.id, appName, iconPrompt);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div 
                className="p-6 rounded-lg shadow-2xl w-full max-w-md border"
                style={{
                    backgroundColor: 'rgba(var(--background-rgb), 0.9)',
                    borderColor: 'rgba(var(--primary-rgb), 0.3)',
                }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--primary-color)' }}>Edit App</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">{ICONS.close}</button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>App Name</label>
                        <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            className="w-full text-cyan-200 rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 transition-all"
                             style={{
                                backgroundColor: 'rgba(var(--background-rgb), 0.7)',
                                color: 'var(--text-color)',
                                borderColor: 'rgba(var(--primary-rgb), 0.3)',
                                '--tw-ring-color': 'var(--primary-color)'
                            } as React.CSSProperties}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>New Icon Prompt (Optional)</label>
                        <p className="text-xs text-slate-400 mb-1">Changes the icon only. To change functionality, use the command bar.</p>
                        <input
                            type="text"
                            value={iconPrompt}
                            onChange={(e) => setIconPrompt(e.target.value)}
                            placeholder="e.g., a smiling sun, a rocket ship"
                            className="w-full text-cyan-200 rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 transition-all"
                            style={{
                                backgroundColor: 'rgba(var(--background-rgb), 0.7)',
                                color: 'var(--text-color)',
                                borderColor: 'rgba(var(--primary-rgb), 0.3)',
                                '--tw-ring-color': 'var(--primary-color)'
                            } as React.CSSProperties}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md transition-colors"
                        style={{
                            backgroundColor: 'rgba(var(--text-rgb), 0.1)',
                            color: 'var(--text-color)'
                        }}
                    >Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !appName.trim()}
                        className="px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                        style={{
                            backgroundColor: 'var(--primary-color)',
                            color: 'var(--background-color)'
                        }}
                    >
                        {isSaving ? 'Generating...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditAppModal;
