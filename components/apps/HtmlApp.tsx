import React from 'react';

interface HtmlAppProps {
    content: {
        htmlContent: string;
    };
}

const HtmlApp: React.FC<HtmlAppProps> = ({ content }) => {
    return (
        <iframe
            srcDoc={content.htmlContent}
            title="Custom HTML App"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
        />
    );
};

export default HtmlApp;