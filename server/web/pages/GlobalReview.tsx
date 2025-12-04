import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Lesson, Flashcard } from '../types';
import { getAllLessons, saveLesson } from '../services/db';
import { updateCard } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { FlashcardGame } from '../components/FlashcardGame';

import { useAuth } from '../contexts/AuthContext';

export const GlobalReview: React.FC = () => {
    const { lang: language, t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [lessonsMap, setLessonsMap] = useState<Map<string, Lesson>>(new Map());

    // Tag Filtering
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        const lessons = await getAllLessons(user?.id);
        const map = new Map<string, Lesson>();
        const cards: Flashcard[] = [];
        const tags = new Set<string>();
        const now = Date.now();

        lessons.forEach(l => {
            map.set(l.id, l);
            let hasDue = false;

            l.flashcards.forEach(fc => {
                if (fc.nextReview <= now) {
                    (fc as any)._lessonId = l.id;
                    cards.push(fc);
                    hasDue = true;
                }
            });

            if (hasDue && l.tags) {
                l.tags.forEach(t => tags.add(t));
            }
        });

        setLessonsMap(map);
        setAllCards(cards);
        setAvailableTags(Array.from(tags).sort());
        setLoading(false);
    };

    const handleUpdateGlobalCard = async (updatedCard: Flashcard) => {
        const lessonId = (updatedCard as any)._lessonId;
        if (!lessonId) return;

        const lesson = lessonsMap.get(lessonId);
        if (!lesson) return;

        const updatedFlashcards = lesson.flashcards.map(c =>
            c.id === updatedCard.id ? updatedCard : c
        );

        const updatedLesson = { ...lesson, flashcards: updatedFlashcards };

        // Update local map
        lessonsMap.set(lessonId, updatedLesson);

        // Save to DB (Local)
        await saveLesson(updatedLesson);

        // Save to Backend
        try {
            await updateCard(updatedCard.id, { front: updatedCard.front, back: updatedCard.back });
        } catch (err) {
            console.error("Failed to update card on server", err);
        }
    };

    const filteredCards = selectedTag
        ? allCards.filter(c => {
            const lesson = lessonsMap.get((c as any)._lessonId);
            return lesson?.tags?.includes(selectedTag);
        })
        : allCards;

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-screen bg-slate-50 flex flex-col">
            <div className="p-4 bg-white shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 text-slate-500"><ArrowLeft /></button>
                    <h1 className="font-bold text-lg">{t.reviewAll}</h1>
                    <div className="w-8"></div>
                </div>

                {/* Tag Filter */}
                {availableTags.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedTag === null
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                # {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 p-4 overflow-hidden">
                <FlashcardGame
                    key={selectedTag || 'all'} // Reset game when tag changes
                    cards={filteredCards}
                    onUpdateCard={handleUpdateGlobalCard}
                    onClose={() => navigate('/')}
                    lang={language}
                />
            </div>
        </div>
    );
};
