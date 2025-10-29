import React from 'react';
import { CustomApp, AppVersion } from '../types';
import { ICONS } from '../constants';

interface VersionHistoryModalProps {
    app: CustomApp;
    onClose: () => void;
    onRevert: (appId: string, versionId: string) => void;
    getActiveVersion: (app: CustomApp) => AppVersion | undefined;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ app, onClose, onRevert, getActiveVersion }) => {
    const activeVersion = getActiveVersion(app);
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div 
                className="p-6 rounded-lg shadow-2xl w-full max-w-lg border flex flex-col"
                style={{
                    backgroundColor: 'rgba(var(--background-rgb), 0.9)',
                    borderColor: 'rgba(var(--primary-rgb), 0.3)',
                    height: 'min(600px, 80vh)'
                }}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--primary-color)' }}>Version History for "{app.name}"</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">{ICONS.close}</button>
                </div>
                
                <ul className="space-y-2 overflow-y-auto pr-2">
                    {app.versions.slice().reverse().map((version, index) => (
                        <li 
                            key={version.versionId} 
                            className="p-3 rounded-md flex items-center justify-between"
                            style={{
                                backgroundColor: 'rgba(var(--background-rgb), 0.5)',
                                border: `1px solid ${version.versionId === activeVersion?.versionId ? 'rgba(var(--primary-rgb), 0.7)' : 'rgba(var(--primary-rgb), 0.2)'}`
                            }}
                        >
                            <div>
                                <p className="font-bold">
                                    Version {app.versions.length - index}
                                    {version.versionId === activeVersion?.versionId && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded" style={{backgroundColor: 'var(--primary-color)', color: 'var(--background-color)'}}>Active</span>}
                                </p>
                                <p className="text-xs" style={{color: 'rgba(var(--text-rgb), 0.7)'}}>
                                    Created on: {new Date(version.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => onRevert(app.id, version.versionId)}
                                disabled={version.versionId === activeVersion?.versionId}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                            >
                                {ICONS.revert} Revert
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default VersionHistoryModal;
