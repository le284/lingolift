import React from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className = '', size = 'md' }) => {
  if (!content) return null;

  // Simple parser logic
  const parseInline = (text: string, keyPrefix: string): React.ReactNode => {
    // Split by bold (**), italic (*), and code (`)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    
    return parts.map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={key} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={key} className="italic text-inherit">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={key} className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[0.9em] font-mono border border-slate-200">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const lines = content.split('\n');

  const getSizeClass = () => {
    switch (size) {
        case 'sm': return 'text-sm';
        case 'lg': return 'text-lg';
        case 'xl': return 'text-xl sm:text-2xl';
        default: return 'text-base';
    }
  };

  return (
    <div className={`markdown-content w-full ${getSizeClass()} ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        // List items
        if (trimmed.startsWith('- ')) {
           return (
             <div key={i} className="flex gap-2 ml-1 mb-1 items-start">
               <span className="opacity-50 mt-[0.4em] text-[0.6em]">•</span>
               <div className="flex-1 leading-relaxed">{parseInline(trimmed.substring(2), `line-${i}`)}</div>
             </div>
           );
        }
        
        // Headers (simple support)
        if (trimmed.startsWith('# ')) {
             return <h3 key={i} className="text-lg font-bold mt-2 mb-1">{parseInline(trimmed.substring(2), `line-${i}`)}</h3>;
        }

        // Empty lines
        if (!trimmed) {
            return <div key={i} className="h-2" />;
        }

        return <div key={i} className="min-h-[1.4em] leading-relaxed mb-1">{parseInline(line, `line-${i}`)}</div>;
      })}
    </div>
  );
};