import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className = '', size = 'md' }) => {
  if (!content) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'prose-sm';
      case 'lg': return 'prose-lg';
      case 'xl': return 'prose-xl';
      default: return 'prose-base';
    }
  };

  return (
    <div className={`markdown-content w-full ${className} prose prose-slate max-w-none ${getSizeClass()} 
          prose-headings:font-bold prose-headings:text-slate-900 
          prose-p:text-slate-600 prose-p:leading-relaxed 
          prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-slate-900 prose-strong:font-bold
          prose-ul:list-disc prose-ul:pl-4
          prose-ol:list-decimal prose-ol:pl-4
          prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-500
          prose-table:w-full prose-table:border-collapse prose-table:my-4
          prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:p-2 prose-th:text-left prose-th:font-bold prose-th:text-slate-700
          prose-td:border prose-td:border-slate-200 prose-td:p-2 prose-td:text-slate-600
          prose-img:rounded-xl prose-img:shadow-sm prose-img:my-4`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};