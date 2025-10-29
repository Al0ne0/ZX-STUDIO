import React from 'react';
import { Agent } from '../../types';

interface AgentManagerAppProps {
    agents: Agent[];
    onAgentsChange: (agents: Agent[]) => void;
}

const AgentManagerApp: React.FC<AgentManagerAppProps> = ({ agents, onAgentsChange }) => {

    const handleToggle = (agentId: string) => {
        onAgentsChange(agents.map(a => a.id === agentId ? { ...a, isEnabled: !a.isEnabled } : a));
    };

    const handleDelete = (agentId: string) => {
        if (window.confirm("Are you sure you want to delete this agent?")) {
            onAgentsChange(agents.filter(a => a.id !== agentId));
        }
    };

    return (
        <div className="h-full w-full text-cyan-200 p-2 space-y-2 overflow-y-auto">
            {agents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No agents created yet. Try asking: "Create an agent to..."</p>
                </div>
            ) : (
                agents.map(agent => (
                    <div key={agent.id} className="p-3 rounded-md flex items-start justify-between gap-4"
                        style={{ backgroundColor: 'rgba(var(--background-rgb), 0.4)' }}>
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${agent.isEnabled ? 'bg-green-400' : 'bg-slate-500'}`}></span>
                                <p className="font-bold truncate">{agent.name}</p>
                            </div>
                            <p className="text-xs font-mono mt-1 p-2 rounded bg-black/20 text-slate-300 whitespace-pre-wrap">
                                {agent.prompt}
                            </p>
                            <p className="text-xs mt-2 text-slate-400">
                                Schedule: Runs every {agent.schedule.slice(0, -1)} {
                                    { 'm': 'minute(s)', 'h': 'hour(s)', 'd': 'day(s)' }[agent.schedule.slice(-1)]
                                }
                                <span className="mx-2">|</span>
                                Last run: {agent.lastRun ? new Date(agent.lastRun).toLocaleString() : 'Never'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button
                                onClick={() => handleToggle(agent.id)}
                                className="px-3 py-1 text-xs rounded"
                                style={{
                                    backgroundColor: agent.isEnabled ? 'rgba(252, 165, 165, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                    color: agent.isEnabled ? 'rgb(252, 165, 165)' : 'rgb(74, 222, 128)',
                                }}
                            >
                                {agent.isEnabled ? 'Disable' : 'Enable'}
                            </button>
                             <button
                                onClick={() => handleDelete(agent.id)}
                                className="px-3 py-1 text-xs rounded bg-slate-600/50 hover:bg-red-500/30 text-slate-300 hover:text-red-400"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default AgentManagerApp;
