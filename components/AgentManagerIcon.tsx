import React from 'react';
import { ICONS } from '../constants';

interface AgentManagerIconProps {
    onLaunch: () => void;
}

const AgentManagerIcon: React.FC<AgentManagerIconProps> = ({ onLaunch }) => {
    return (
        <div 
            className="flex flex-col items-center justify-center text-center w-20 h-20 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/10"
            onDoubleClick={onLaunch}
            title="Open Agent Manager"
        >
            <div 
                className="w-8 h-8 mb-1"
                style={{ color: 'var(--text-color)'}}
            >
                {ICONS.agentManager}
            </div>
            <span className="text-xs text-white" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>
                Agents
            </span>
        </div>
    );
};

export default AgentManagerIcon;
