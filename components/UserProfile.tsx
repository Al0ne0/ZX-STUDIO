import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';

interface UserProfileProps {
    user: User | null;
    onLogout: () => void;
    onEditProfile: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onEditProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const handleEditClick = () => {
        onEditProfile();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
                <img
                    src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.displayName || user.email}`}
                    alt="User"
                    className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm hidden sm:inline truncate max-w-[100px]">{user.displayName || 'User'}</span>
            </button>
            {isOpen && (
                <div 
                    className="absolute bottom-full right-0 mb-2 w-48 rounded-md shadow-lg py-1 border"
                    style={{
                        backgroundColor: 'rgba(var(--background-rgb), 0.9)',
                        borderColor: 'rgba(var(--primary-rgb), 0.3)',
                    }}
                >
                    <div className="px-4 py-2 border-b border-slate-700">
                        <p className="text-sm font-medium truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={handleEditClick}
                        className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-white/10"
                    >
                        {ICONS.edit}
                        Edit Profile
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                        {ICONS.logout}
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
