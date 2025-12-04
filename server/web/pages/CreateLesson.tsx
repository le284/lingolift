import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, FileCode } from 'lucide-react';
import { createLesson, updateLesson } from '../services/api';
import { saveLesson, getLesson } from '../services/db';
import { useLanguage } from '../contexts/LanguageContext';

export const CreateLesson: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID if editing
    const { t, lang, toggleLang } = useLanguage();
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<'markdown' | 'pdf'>('markdown');
    const [loading, setLoading] = useState(!!id);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [markdownContent, setMarkdownContent] = useState('');
    const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadLesson(id);
        }
    }, [id]);

    const loadLesson = async (lessonId: string) => {
        try {
            const lesson = await getLesson(lessonId);
            if (lesson) {
                setTitle(lesson.title);
                setDescription(lesson.description || '');
                setTags(lesson.tags ? lesson.tags.join(', ') : '');
                setMarkdownContent(lesson.markdownContent || '');
                if (lesson.pdfUrl || lesson.pdfBlob) {
                    setExistingPdfUrl(lesson.pdfUrl || (lesson.pdfBlob ? URL.createObjectURL(lesson.pdfBlob) : null));
                    setActiveTab('pdf');
                } else {
                    setActiveTab('markdown');
                }
            }
        } catch (error) {
            console.error("Failed to load lesson", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) return;

        setCreating(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            if (tags) formData.append('tags', tags);
            if (audioFile) formData.append('audio', audioFile);

            // Only append content based on active tab
            if (activeTab === 'pdf' && pdfFile) {
                formData.append('pdf', pdfFile);
            } else if (activeTab === 'markdown' && markdownContent) {
                formData.append('markdown', markdownContent);
            }

            let savedLesson;
            if (id) {
                savedLesson = await updateLesson(id, formData);
            } else {
                savedLesson = await createLesson(formData);
            }

            await saveLesson(savedLesson);

            navigate('/');
        } catch (err) {
            console.error("Failed to save lesson", err);
            alert("Failed to save lesson");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    }



    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 text-slate-500"><ArrowLeft /></button>
                    <h1 className="font-bold text-lg">{id ? t.createLesson.editTitle : t.createLesson.title}</h1>
                </div>
                <button
                    onClick={toggleLang}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm"
                >
                    {lang === 'en' ? 'EN' : '中'}
                </button>
            </header>

            <div className="p-4 max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.createLesson.lessonTitle}</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={t.createLesson.lessonTitle}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.createLesson.description}</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                                placeholder={t.createLesson.description}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.createLesson.tags}</label>
                            <input
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={t.createLesson.tags}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.createLesson.audio}</label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.createLesson.content}</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setActiveTab('markdown')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'markdown' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileCode size={16} /> {t.createLesson.tabMarkdown}
                            </button>
                            <button
                                onClick={() => setActiveTab('pdf')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'pdf' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText size={16} /> {t.createLesson.tabPdf}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[200px]">
                            {activeTab === 'markdown' ? (
                                <textarea
                                    value={markdownContent}
                                    onChange={(e) => setMarkdownContent(e.target.value)}
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[200px] font-mono text-sm"
                                    placeholder={t.createLesson.markdownPlaceholder}
                                />
                            ) : (
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors bg-slate-50">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full"
                                    />
                                    <p className="text-sm text-slate-400 mt-2">Upload a PDF document</p>
                                    {existingPdfUrl && !pdfFile && (
                                        <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm flex items-center justify-center gap-2">
                                            <FileText size={16} />
                                            <span>Current PDF available</span>
                                        </div>
                                    )}
                                    {pdfFile && (
                                        <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center justify-center gap-2">
                                            <FileText size={16} />
                                            <span>New PDF selected: {pdfFile.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3 border-t border-slate-100">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            {t.createLesson.cancel}
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!title || creating || (activeTab === 'pdf' && !pdfFile && !existingPdfUrl) || (activeTab === 'markdown' && !markdownContent)}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            {creating && <Loader2 size={16} className="animate-spin" />}
                            {creating ? (id ? t.createLesson.updating : t.createLesson.creating) : (id ? t.createLesson.update : t.createLesson.create)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
