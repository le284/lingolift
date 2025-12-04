import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Plus,
    Brain,
    Cloud,
    Calendar,
    Tag,
    Headphones,
    FileText,
    Layers,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { Lesson } from '../types';
import { saveLesson, getAllLessons, deleteLesson as deleteLessonLocal } from '../services/db';
import { deleteLesson, getLessons } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { useAuth } from '../contexts/AuthContext';

export const LessonList: React.FC = () => {
    const { t, lang: language, toggleLang: toggleLanguage } = useLanguage();
    const { user } = useAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalDue, setTotalDue] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadLessons();
    }, [user]);

    const loadLessons = async () => {
        try {
            // 1. Fetch from Backend (Source of Truth)
            const remoteLessons = await getLessons();
            setLessons(remoteLessons.sort((a, b) => b.createdAt - a.createdAt));

            // Extract Tags
            const tags = new Set<string>();
            remoteLessons.forEach(l => {
                l.tags?.forEach(t => tags.add(t));
            });
            setAvailableTags(Array.from(tags).sort());

            const now = Date.now();
            let dueCount = 0;
            remoteLessons.forEach(l => {
                l.flashcards.forEach(fc => {
                    if (fc.nextReview <= now) dueCount++;
                });
            });
            setTotalDue(dueCount);

        } catch (err) {
            console.error("Failed to load lessons", err);
        } finally {
            setLoading(false);
        }
    };

    const groupLessonsByMonth = (lessons: Lesson[]) => {
        const groups: { [key: string]: Lesson[] } = {};
        lessons.forEach(lesson => {
            const date = new Date(lesson.createdAt);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(lesson);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    };

    const filteredLessons = lessons.filter(lesson => {
        // Tag Filter
        if (selectedTag && !lesson.tags?.includes(selectedTag)) {
            return false;
        }

        // Search Query
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const matchesTitle = lesson.title.toLowerCase().includes(query);
        const matchesTags = lesson.tags?.some(tag => tag.toLowerCase().includes(query));
        return matchesTitle || matchesTags;
    });

    const groupedLessons = groupLessonsByMonth(filteredLessons);

    const getMonthLabel = (key: string) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    }

    return (
        <div className="pb-32 min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-md p-6 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                <div className="flex justify-between items-center max-w-2xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t.appTitle}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {totalDue > 0 ? (
                                <span className="text-xs font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Brain size={10} /> {totalDue} {t.due}
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t.allCaughtUp}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/create"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                            title="Create Lesson"
                        >
                            <Plus size={20} />
                        </Link>
                        <button
                            onClick={toggleLanguage}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm"
                        >
                            {language === 'en' ? 'EN' : '中'}
                        </button>
                        <Link to="/vocabulary" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Vocabulary">
                            <BookOpen size={20} />
                        </Link>
                        <Link to="/profile" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Profile">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.vocabulary.searchPlaceholder || "Search lessons or tags..."}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    )}
                </div>

                {/* Tag Filter */}
                {availableTags.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedTag === null
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            All
                        </button>
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedTag === tag
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                # {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <main className="p-4 max-w-2xl mx-auto space-y-4">
                {lessons.length === 0 ? (
                    <div className="text-center mt-20 px-6 animate-fade-in">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Cloud size={32} className="text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{t.noLessons}</h3>
                        <p className="text-slate-500 mb-8">Create a new lesson to get started.</p>
                        <Link to="/create" className="text-indigo-600 font-medium hover:underline flex items-center justify-center gap-2 mx-auto">
                            <Plus size={16} /> Create Lesson
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {groupedLessons.map(([key, groupLessons]) => (
                            <div key={key}>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 px-2">
                                    <Calendar size={14} />
                                    {getMonthLabel(key)}
                                </h2>
                                <div className="space-y-4">
                                    {groupLessons.map((lesson) => {
                                        const dueCount = lesson.flashcards.filter(c => c.nextReview <= Date.now()).length;
                                        return (
                                            <Link
                                                key={lesson.id}
                                                to={`/lesson/${lesson.id}`}
                                                className="block bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.99] transition-transform relative overflow-hidden"
                                            >
                                                {dueCount > 0 && (
                                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                                        {dueCount} {t.due}
                                                    </div>
                                                )}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0 mr-4">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-bold text-slate-800 truncate text-lg mb-1">{lesson.title}</h3>
                                                        </div>
                                                        <p className="text-slate-500 text-sm line-clamp-2">{lesson.description || t.lesson.description}</p>

                                                        {/* Tags */}
                                                        {lesson.tags && lesson.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                {lesson.tags.map((tag, i) => (
                                                                    <span key={i} className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                        <Tag size={10} className="mr-1" /> {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex gap-3 mt-4">
                                                            {(lesson.audioBlob || lesson.audioUrl) && (
                                                                <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                                    <Headphones size={12} className="mr-1" /> {t.lesson.audio}
                                                                </span>
                                                            )}
                                                            {(lesson.pdfBlob || lesson.pdfUrl || lesson.markdownContent) && (
                                                                <span className="inline-flex items-center text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                                                                    <FileText size={12} className="mr-1" /> {t.lesson.pdf}
                                                                </span>
                                                            )}
                                                            <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                                                <Layers size={12} className="mr-1" /> {lesson.flashcards.length} {t.lesson.cards}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-slate-300 self-center">
                                                        <ArrowLeft size={20} className="rotate-180" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Action Button for Global Review */}
            {totalDue > 0 && (
                <Link to="/review" className="fixed bottom-24 right-6 z-40">
                    <button className="flex items-center gap-2 bg-indigo-600 text-white pl-4 pr-6 py-4 rounded-full shadow-xl hover:bg-indigo-700 active:scale-95 transition-transform">
                        <Brain size={24} />
                        <span className="font-bold text-lg">{t.reviewAll} ({totalDue})</span>
                    </button>
                </Link>
            )}
        </div>
    );
};
