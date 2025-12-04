import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PDFViewerProps {
    url: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    return (
        <div className="w-full bg-slate-100 min-h-[300px] flex flex-col items-center p-4 overflow-y-auto h-full">
            <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                }
                className="w-full max-w-2xl"
            >
                {Array.from(new Array(numPages), (_, index) => (
                    <div key={`page_${index + 1}`} className="mb-4 shadow-lg">
                        <Page
                            pageNumber={index + 1}
                            width={window.innerWidth > 768 ? 700 : window.innerWidth - 48} // Responsive width
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="bg-white"
                        />
                    </div>
                ))}
            </Document>
        </div>
    );
};
