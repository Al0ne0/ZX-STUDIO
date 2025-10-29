import React from 'react';

interface WebSearchAppProps {
    content: {
        summary: string;
        sources: { uri: string; title: string }[];
    };
}

const WebSearchApp: React.FC<WebSearchAppProps> = ({ content }) => {
    const { summary, sources } = content;

    return (
        <div className="text-cyan-200 space-y-4" style={{ color: 'var(--text-color)'}}>
            <div className="p-3 rounded-md" style={{ backgroundColor: 'rgba(var(--background-rgb), 0.3)'}}>
                <h3 className="font-bold mb-2" style={{ color: 'var(--primary-color)'}}>Summary</h3>
                <p className="text-sm whitespace-pre-wrap">{summary}</p>
            </div>
            {sources && sources.length > 0 && (
                <div>
                    <h3 className="font-bold mb-2" style={{ color: 'var(--primary-color)'}}>Sources</h3>
                    <ul className="space-y-2">
                        {sources.map((source, index) => (
                            <li key={index} 
                                className="text-xs p-2 rounded-md transition-colors"
                                style={{ backgroundColor: 'rgba(var(--background-rgb), 0.3)'}}
                            >
                                <a
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                    style={{ color: 'var(--primary-color)'}}
                                >
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default WebSearchApp;