import React from 'react';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export default function MessageRenderer({ content, className = '' }: MessageRendererProps) {
  const formatContent = (text: string) => {
    // Split by lines to handle line breaks properly
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Handle empty lines as line breaks
      if (line.trim() === '') {
        return <br key={lineIndex} />;
      }
      
      // Handle headers
      if (line.startsWith('### ')) {
        const headerText = line.replace('### ', '');
        return (
          <h3 key={lineIndex} className="text-lg font-semibold text-gray-800 mb-2 mt-3">
            {formatInlineElements(headerText)}
          </h3>
        );
      }
      
      if (line.startsWith('## ')) {
        const headerText = line.replace('## ', '');
        return (
          <h2 key={lineIndex} className="text-xl font-bold text-gray-800 mb-2 mt-3">
            {formatInlineElements(headerText)}
          </h2>
        );
      }
      
      if (line.startsWith('# ')) {
        const headerText = line.replace('# ', '');
        return (
          <h1 key={lineIndex} className="text-2xl font-bold text-gray-800 mb-3 mt-4">
            {formatInlineElements(headerText)}
          </h1>
        );
      }
      
      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.replace(/^\s*[-*]\s/, '');
        return (
          <div key={lineIndex} className="flex items-start mb-1">
            <span className="text-gray-600 mr-2">•</span>
            <span>{formatInlineElements(bulletText)}</span>
          </div>
        );
      }
      
      // Regular paragraphs
      return (
        <p key={lineIndex} className="mb-2">
          {formatInlineElements(line)}
        </p>
      );
    });
  };
  
  const formatInlineElements = (text: string) => {
    // Handle inline code blocks (like wallet addresses)
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-700 border">$1</code>');
    
    // Handle bold text with better styling
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    
    // Handle emojis and status indicators with proper spacing
    text = text.replace(/(✅|❌|💰|🔐|⚡|🔗)/g, '<span class="inline-block mr-1">$1</span>');
    
    // Split by HTML tags and text to properly render
    const parts = text.split(/(<[^>]+>[^<]*<\/[^>]+>|<[^>]+\/>)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('<code')) {
        const match = part.match(/<code[^>]*>([^<]+)<\/code>/);
        if (match) {
          return (
            <code 
              key={index} 
              className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-700 border"
            >
              {match[1]}
            </code>
          );
        }
      }
      
      if (part.startsWith('<strong')) {
        const match = part.match(/<strong[^>]*>([^<]+)<\/strong>/);
        if (match) {
          return (
            <strong key={index} className="font-semibold text-gray-900">
              {match[1]}
            </strong>
          );
        }
      }
      
      if (part.startsWith('<span')) {
        const match = part.match(/<span[^>]*>([^<]+)<\/span>/);
        if (match) {
          return (
            <span key={index} className="inline-block mr-1">
              {match[1]}
            </span>
          );
        }
      }
      
      // Regular text
      if (!part.startsWith('<')) {
        return <span key={index}>{part}</span>;
      }
      
      return null;
    }).filter(Boolean);
  };
  
  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      {formatContent(content)}
    </div>
  );
}