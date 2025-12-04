import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Plus,
    Trash2,
    BookOpen,
    FileText,
    Layers,
    Headphones,
    Loader2
} from 'lucide-react';
import { Lesson, Flashcard, PlayMode } from '../types';
import { getLesson, deleteLesson as deleteLessonLocal, saveLesson } from '../services/db';
import { deleteLesson, createCard } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { Markdown } from './Markdown';
import { createInitialSRSState } from '../services/srs';
import { generateUUID } from '../utils/uuid';

// Interface to props for the AudioPlayer in the Detail view
export interface PlayerControls {
    play: (url: string, title: string) => void;
    pause: () => void;
    isPlaying: boolean;
    currentUrl: string | null;
    mode: PlayMode;
    toggleMode: () => void;
}

export const LessonDetail: React.FC<{ playerControls: PlayerControls }> = ({ playerControls }) => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'read' | 'vocab'>('overview');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [markdownContent, setMarkdownContent] = useState<string | null>(null);

    // Add Word Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');

    useEffect(() => {
        if (id) loadLesson(id);
        return () => {
            // Only revoke blob URLs, not remote ones
            if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
            if (pdfUrl && pdfUrl.startsWith('blob:')) URL.revokeObjectURL(pdfUrl);
        };
    }, [id]);

    const loadLesson = async (lessonId: string) => {
        try {
            // Reset state before loading new lesson
            setAudioUrl(null);
            setPdfUrl(null);
            setMarkdownContent(null);

            const data = await getLesson(lessonId);
            if (!data) {
                navigate('/');
                return;
            }
            setLesson(data);

            // Determine Audio URL (Blob priority for offline, then Remote)
            if (data.audioBlob) {
                setAudioUrl(URL.createObjectURL(data.audioBlob));
            } else if (data.audioUrl) {
                setAudioUrl(data.audioUrl);
            }

            // Determine PDF URL
            if (data.pdfBlob) {
                setPdfUrl(URL.createObjectURL(data.pdfBlob));
            } else if (data.pdfUrl) {
                setPdfUrl(data.pdfUrl);
            }

            // Determine Markdown Content
            if (data.markdownContent) {
                setMarkdownContent(data.markdownContent);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!lesson || !confirm("Are you sure you want to delete this lesson?")) return;
        try {
            await deleteLesson(lesson.id);
            await deleteLessonLocal(lesson.id);
            navigate('/');
        } catch (err) {
            console.error("Failed to delete lesson", err);
            alert("Failed to delete lesson");
        }
    };

    const handleAddWord = async () => {
        if (!lesson || !newFront.trim() || !newBack.trim()) return;

        const newCard: Flashcard = {
            id: generateUUID(),
            front: newFront,
            back: newBack,
            isUserCreated: true, // Mark as user-created so sync preserves it
            ...createInitialSRSState()
        };

        const updatedLesson = { ...lesson, flashcards: [...(lesson.flashcards || []), newCard] };
        setLesson(updatedLesson);
        await saveLesson(updatedLesson);

        // Save to Backend
        try {
            // Ensure lessonId is included. The backend requires it.
            // We pass it explicitly here, even though it might not be in the Flashcard type locally.
            await createCard({ ...newCard, lessonId: lesson.id });
        } catch (err) {
            console.error("Failed to create card on server", err);
        }

        setNewFront('');
        setNewBack('');
        setShowAddModal(false);
    };

    if (!lesson) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 text-slate-600 hover:bg-slate-50 rounded-full">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-slate-900 truncate max-w-[200px]">{lesson.title}</h1>
                </div>

                <div className="flex gap-2">
                    <Link
                        to={`/edit/${lesson.id}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                        title={t.createLesson.editTitle}
                    >
                        <Edit size={24} />
                    </Link>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                    >
                        <Plus size={24} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        title="Delete Lesson"
                    >
                        <Trash2 size={24} />
                    </button>
                </div>
            </header>

            <div className="flex border-b border-slate-200 bg-white">
                {[
                    { id: 'overview', label: t.lesson.overview, icon: BookOpen },
                    { id: 'read', label: t.lesson.readPdf, icon: FileText },
                    { id: 'vocab', label: t.lesson.wordList, icon: Layers },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="flex-1 p-4 overflow-y-auto pb-36 max-w-4xl mx-auto w-full">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">{t.lesson.description}</h2>
                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {lesson.description || 'No description provided.'}
                            </p>
                        </div>

                        {audioUrl ? (
                            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg mb-1">{t.lesson.audio}</h3>
                                    <p className="text-indigo-200 text-sm mb-6">{t.lesson.playAudio}</p>

                                    <button
                                        onClick={() => playerControls.currentUrl === audioUrl && playerControls.isPlaying ? playerControls.pause() : playerControls.play(audioUrl, lesson.title)}
                                        className="flex items-center gap-3 bg-white text-indigo-900 px-6 py-3 rounded-full font-bold shadow-md active:scale-95 transition-transform"
                                    >
                                        {playerControls.currentUrl === audioUrl && playerControls.isPlaying ? (
                                            <> {t.lesson.pauseAudio} <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-red-500 ml-2"></span></>
                                        ) : (
                                            <> {t.lesson.playAudio} <Headphones size={18} /></>
                                        )}
                                    </button>
                                </div>
                                <Headphones className="absolute -bottom-4 -right-4 text-indigo-800 opacity-20" size={120} />
                            </div>
                        ) : (
                            <div className="bg-slate-100 p-6 rounded-2xl text-center text-slate-400">
                                {t.lesson.noAudio}
                            </div>
                        )}

                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
                            <h3 className="font-bold text-amber-900 mb-2">{t.lesson.vocab}</h3>
                            <div className="flex gap-4 text-sm text-amber-800 flex-col sm:flex-row mb-4">
                                <span>• {lesson.flashcards?.length || 0} {t.lesson.vocabCount}</span>
                                <span>• {lesson.flashcards?.filter(c => c.isUserCreated).length || 0} {t.lesson.addedByYou}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(lesson.flashcards || []).slice(0, 5).map(fc => (
                                    <span key={fc.id} className="text-xs bg-white px-2 py-1 rounded border border-amber-200 text-amber-900">{fc.front.substring(0, 15)}...</span>
                                ))}
                                {(lesson.flashcards?.length || 0) > 5 && <span className="text-xs text-amber-600 self-center">+{lesson.flashcards.length - 5} more</span>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'read' && (
                    <div className="h-[calc(100vh-180px)] bg-slate-200 rounded-xl border border-slate-300 overflow-hidden">
                        {pdfUrl ? (
                            <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
                        ) : markdownContent ? (
                            <div className="h-full overflow-y-auto bg-white p-8">
                                <Markdown content={markdownContent} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <FileText size={48} className="mb-4 text-slate-300" />
                                <p>{t.lesson.noPdf}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'vocab' && (
                    <div className="pb-24 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            {(lesson.flashcards?.length || 0) === 0 ? (
                                <div className="p-8 text-center text-slate-500">{t.game.noCards}</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {lesson.flashcards.map((fc, idx) => (
                                        <div key={fc.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-4 flex-1">
                                                <span className="text-slate-300 text-xs font-mono w-4 mt-1">{idx + 1}</span>
                                                <div className="w-full">
                                                    <div className="text-slate-800 text-lg mb-1">
                                                        <Markdown content={fc.front} className="font-bold" />
                                                    </div>
                                                    <div className="text-slate-500 text-sm">
                                                        <Markdown content={fc.back} />
                                                    </div>
                                                </div>
                                            </div>
                                            {fc.isUserCreated && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full self-start shrink-0">User</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-6 w-full py-4 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> {t.lesson.addWord}
                        </button>
                    </div>
                )}
            </main>

            {/* Add Word Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">{t.lesson.addWord}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.lesson.word} (Markdown)</label>
                                <textarea
                                    value={newFront}
                                    onChange={(e) => setNewFront(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                                    placeholder="**Bold**, *Italic*, etc."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.lesson.def} (Markdown)</label>
                                <textarea
                                    value={newBack}
                                    onChange={(e) => setNewBack(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium"
                                >
                                    {t.lesson.cancel}
                                </button>
                                <button
                                    onClick={handleAddWord}
                                    disabled={!newFront || !newBack}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                                >
                                    {t.lesson.add}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
