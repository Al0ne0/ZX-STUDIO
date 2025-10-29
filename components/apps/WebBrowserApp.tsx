import React, { useState, FormEvent } from 'react';

interface WebBrowserAppProps {
    content: {
        url?: string;
    };
}

const WebBrowserApp: React.FC<WebBrowserAppProps> = ({ content }) => {
    const [currentUrl, setCurrentUrl] = useState(content.url || 'https://www.google.com/webhp?igu=1');
    const [inputValue, setInputValue] = useState(currentUrl);

    const handleNavigate = (e: FormEvent) => {
        e.preventDefault();
        let url = inputValue.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }
        setCurrentUrl(url);
    };

    return (
        <div className="h-full w-full flex flex-col bg-gray-800">
            <div className="p-1 bg-gray-700/50 flex items-center gap-2">
                <form onSubmit={handleNavigate} className="flex-grow">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full text-cyan-200 rounded-md px-3 py-1 text-sm border focus:outline-none focus:ring-2 transition-all"
                        style={{
                            backgroundColor: 'rgba(var(--background-rgb), 0.7)',
                            color: 'var(--text-color)',
                            borderColor: 'rgba(var(--primary-rgb), 0.3)',
                            '--tw-ring-color': 'var(--primary-color)'
                        } as React.CSSProperties}
                        placeholder="Enter URL and press Enter"
                    />
                </form>
            </div>
            <iframe
                src={currentUrl}
                title="Web Browser"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="w-full h-full border-0"
            />
        </div>
    );
};

export default WebBrowserApp;