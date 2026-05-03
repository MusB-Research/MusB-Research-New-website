import React from 'react';

interface MarkdownTextProps {
    text: string;
    className?: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ text, className = "" }) => {
    if (!text) return null;

    // Simple regex-based markdown parser for:
    // **bold**, __bold__, _italic_, *italic*, <u>underline</u>, [link](url)
    
    let processed = text
        // Handle bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Handle italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Handle underline
        .replace(/<u>(.*?)<\/u>/g, '<u class="underline decoration-blue-500/30">$1</u>')
        // Handle links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline font-bold">$1</a>');

    return (
        <span 
            className={className}
            dangerouslySetInnerHTML={{ __html: processed }}
        />
    );
};
