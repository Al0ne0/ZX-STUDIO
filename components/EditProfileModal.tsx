import React, { useState, useRef } from 'react';
import { User, UserProfileUpdate } from '../types';
import { ICONS } from '../constants';

interface EditProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (updates: UserProfileUpdate) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(user.photoURL);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicFile(file);
            setProfilePicPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const updates: UserProfileUpdate = {};
        if (displayName !== user.displayName) {
            updates.displayName = displayName;
        }
        if (profilePicFile) {
            updates.newProfilePicture = profilePicFile;
        }

        if (Object.keys(updates).length > 0) {
            await onSave(updates);
        }
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
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--primary-color)' }}>Edit Profile</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">{ICONS.close}</button>
                </div>
                
                <div className="space-y-4">
                    <div className="flex flex-col items-center">
                        <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center cursor-pointer mb-2 bg-slate-800/50 hover:border-[var(--primary-color)] transition-colors">
                             {profilePicPreview ? (
                                <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover rounded-full"/>
                            ) : (
                                <span className="text-xs text-slate-400 text-center">Change Picture</span>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
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
                        disabled={isSaving}
                        className="px-4 py-2 rounded-md transition-colors disabled:opacity-50 w-24 flex justify-center"
                        style={{
                            backgroundColor: 'var(--primary-color)',
                            color: 'var(--background-color)'
                        }}
                    >
                        {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[var(--background-color)]"></div> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
