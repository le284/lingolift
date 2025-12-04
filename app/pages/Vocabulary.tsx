import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Edit2, Plus, Loader2 } from 'lucide-react';
import { getAllLessons, saveLesson, saveDeletedCardId } from '../services/db';
import { Lesson, Flashcard } from '../types';
import { Markdown } from '../components/Markdown';
import { createInitialSRSState } from '../services/srs';
import { useLanguage } from '../contexts/LanguageContext';

import { generateUUID } from '../utils/uuid';

export const Vocabulary: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Add State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');
    const [selectedLessonId, setSelectedLessonId] = useState('');
    const [lessons, setLessons] = useState<Lesson[]>([]);

    // Original State
    const [cards, setCards] = useState<{ lessonId: string; card: Flashcard }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingCard, setEditingCard] = useState<{ lessonId: string; card: Flashcard } | null>(null);
    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');

    // Tag State
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        try {
            const allLessons = await getAllLessons();
            setLessons(allLessons);

            const allCards: { lessonId: string; card: Flashcard }[] = [];
            const tags = new Set<string>();

            allLessons.forEach(l => {
                l.flashcards.forEach(c => {
                    allCards.push({ lessonId: l.id, card: c });
                });
                l.tags?.forEach(t => tags.add(t));
            });
            setCards(allCards);
            setAvailableTags(Array.from(tags).sort());

            if (allLessons.length > 0) {
                setSelectedLessonId(allLessons[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (lessonId: string, cardId: string) => {
        if (!confirm(t.vocabulary.deleteConfirm)) return;

        // 1. Find lesson
        const lessons = await getAllLessons();
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        // 2. Remove card
        lesson.flashcards = lesson.flashcards.filter(c => c.id !== cardId);
        await saveLesson(lesson);

        // 3. Track deletion for sync
        await saveDeletedCardId(cardId);

        // 4. Update UI
        setCards(prev => prev.filter(c => c.card.id !== cardId));
    };

    const startEdit = (item: { lessonId: string; card: Flashcard }) => {
        setEditingCard(item);
        setEditFront(item.card.front);
        setEditBack(item.card.back);
    };

    const handleSaveEdit = async () => {
        if (!editingCard) return;

        const lessons = await getAllLessons();
        const lesson = lessons.find(l => l.id === editingCard.lessonId);
        if (!lesson) return;

        const card = lesson.flashcards.find(c => c.id === editingCard.card.id);
        if (!card) return;

        card.front = editFront;
        card.back = editBack;
        card.lastUpdated = Date.now();

        await saveLesson(lesson);

        // Update UI
        setCards(prev => prev.map(c => c.card.id === card.id ? { ...c, card: { ...card } } : c));
        setEditingCard(null);
    };

    const handleAddCard = async () => {
        if (!selectedLessonId || !newFront.trim() || !newBack.trim()) return;

        const lesson = lessons.find(l => l.id === selectedLessonId);
        if (!lesson) return;

        const newCard: Flashcard = {
            id: generateUUID(),
            front: newFront,
            back: newBack,
            isUserCreated: true,
            ...createInitialSRSState(),
            lastUpdated: Date.now()
        };

        // Add to lesson
        lesson.flashcards.push(newCard);
        await saveLesson(lesson);

        // Update UI
        setCards(prev => [...prev, { lessonId: selectedLessonId, card: newCard }]);

        setNewFront('');
        setNewBack('');
        setShowAddModal(false);
    };

    const filteredCards = cards.filter(c => {
        // Tag Filter
        if (selectedTag) {
            const lesson = lessons.find(l => l.id === c.lessonId);
            if (!lesson?.tags?.includes(selectedTag)) return false;
        }

        // Search Filter
        return c.card.front.toLowerCase().includes(search.toLowerCase()) ||
            c.card.back.toLowerCase().includes(search.toLowerCase());
    });

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 text-slate-500"><ArrowLeft /></button>
                        <h1 className="font-bold text-lg">{t.vocabulary.title} ({cards.length})</h1>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} /> {t.vocabulary.addWord}
                    </button>
                </div>
            </header>

            <div className="p-4 max-w-2xl mx-auto">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder={t.vocabulary.searchPlaceholder}
                    />
                </div>

                {/* Tag Filter */}
                {availableTags.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
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

                <div className="space-y-3">
                    {filteredCards.map(({ lessonId, card }) => (
                        <div key={card.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 mb-1"><Markdown content={card.front} /></div>
                                <div className="text-slate-500 text-sm"><Markdown content={card.back} /></div>
                                <div className="text-xs text-slate-300 mt-2 flex gap-2">
                                    <span>{t.vocabulary.interval}: {card.interval}d</span>
                                    {card.isUserCreated && <span className="bg-indigo-50 text-indigo-600 px-1 rounded">{t.vocabulary.user}</span>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit({ lessonId, card })} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(lessonId, card.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {filteredCards.length === 0 && <div className="text-center text-slate-400 py-10">{t.vocabulary.noWords}</div>}
                </div>
            </div>

            {/* Edit Modal */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">{t.vocabulary.editWord}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">{t.vocabulary.front}</label>
                                <textarea value={editFront} onChange={e => setEditFront(e.target.value)} className="w-full p-3 border rounded-xl mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">{t.vocabulary.back}</label>
                                <textarea value={editBack} onChange={e => setEditBack(e.target.value)} className="w-full p-3 border rounded-xl mt-1" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEditingCard(null)} className="flex-1 py-3 bg-slate-100 rounded-xl">{t.vocabulary.cancel}</button>
                                <button onClick={handleSaveEdit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">{t.vocabulary.save}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">{t.vocabulary.addNewWord}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">{t.vocabulary.lesson}</label>
                                <select
                                    value={selectedLessonId}
                                    onChange={e => setSelectedLessonId(e.target.value)}
                                    className="w-full p-3 border rounded-xl mt-1 bg-white"
                                >
                                    {lessons.map(l => (
                                        <option key={l.id} value={l.id}>{l.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">{t.vocabulary.front} (Markdown)</label>
                                <textarea
                                    value={newFront}
                                    onChange={e => setNewFront(e.target.value)}
                                    className="w-full p-3 border rounded-xl mt-1 min-h-[80px]"
                                    placeholder={t.vocabulary.front}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">{t.vocabulary.back} (Markdown)</label>
                                <textarea
                                    value={newBack}
                                    onChange={e => setNewBack(e.target.value)}
                                    className="w-full p-3 border rounded-xl mt-1 min-h-[80px]"
                                    placeholder={t.vocabulary.back}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl">{t.vocabulary.cancel}</button>
                                <button
                                    onClick={handleAddCard}
                                    disabled={!selectedLessonId || !newFront || !newBack}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
                                >
                                    {t.vocabulary.add}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
