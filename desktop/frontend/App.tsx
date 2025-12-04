import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Headphones,
  Plus,
  ArrowLeft,
  FileText,
  Layers,
  Loader2,
  Brain,
  RefreshCw,
  Cloud,
  Globe,
  PlayCircle,
  Settings,
  Trash2,
  Calendar,
  Tag
} from 'lucide-react';
import { Lesson, PlayMode, Flashcard } from './types';
import { saveLesson, getAllLessons, getLesson, deleteLesson } from './services/db';
import { AudioPlayer } from './components/AudioPlayer';
import { FlashcardGame } from './components/FlashcardGame';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import { PDFViewer } from './components/PDFViewer';
import { createInitialSRSState } from './services/srs';
import { syncLessons, resetSyncTime } from './services/sync';
import { getServerUrl, setServerUrl } from './services/api';

import { Vocabulary } from './pages/Vocabulary';
import { translations, Language } from './utils/translations';
import { Markdown } from './components/Markdown';
import { LanguageContext, useLanguage } from './contexts/LanguageContext';

// --- Contexts ---
// Moved to contexts/LanguageContext.tsx

// --- Components for Pages ---

const LessonList: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [totalDue, setTotalDue] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl());
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('api_key') || '');
  const [serverUrl, setServerUrlState] = useState(getServerUrl());
  const [searchQuery, setSearchQuery] = useState('');

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const data = await getAllLessons();
      setLessons(data.sort((a, b) => b.createdAt - a.createdAt));

      // Extract Tags
      const tags = new Set<string>();
      data.forEach(l => {
        l.tags?.forEach(t => tags.add(t));
      });
      setAvailableTags(Array.from(tags).sort());

      console.log('[LessonList] Loaded lessons:', data.length);
      const now = Date.now();
      let dueCount = 0;
      data.forEach(l => {
        l.flashcards.forEach(fc => {
          if (fc.nextReview <= now) dueCount++;
        });
      });
      console.log('[LessonList] Calculated due count:', dueCount);
      setTotalDue(dueCount);

    } catch (err) {
      console.error("Failed to load lessons", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncLessons();
      await loadLessons(); // Reload from DB after sync
    } catch (error) {
      alert(t.syncFail);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = () => {
    setServerUrl(serverUrlInput);
    localStorage.setItem('api_key', apiKeyInput);
    setServerUrlState(serverUrlInput);
    setShowSettings(false);
  };

  const handleResetSync = () => {
    if (confirm(t.confirmResetSync || "Are you sure you want to reset sync? This will force a full re-download.")) {
      resetSyncTime();
      alert("Sync history reset. Please sync again.");
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
    return date.toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN', { month: 'long', year: 'numeric' });
  };

  const handleDeleteLesson = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event propagation

    if (confirm(t.confirmDeleteLesson || "Are you sure you want to delete this lesson? This action cannot be undone.")) {
      try {
        await deleteLesson(id);
        setLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== id));
        // alert("Lesson deleted."); // Optional feedback
      } catch (error) {
        console.error("Error deleting lesson:", error);
        alert("Failed to delete lesson.");
      }
    }
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
            <button
              onClick={toggleLang}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm"
            >
              {lang === 'en' ? 'EN' : '中'}
            </button>
            <Link to="/vocabulary" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Vocabulary">
              <BookOpen size={20} />
            </Link>
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-slate-900 text-white p-3 rounded-full shadow-lg shadow-slate-300 active:scale-95 transition-transform disabled:opacity-70"
            >
              {syncing ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
            </button>
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
            <p className="text-slate-500 mb-8">{t.tapSync}</p>
            <button onClick={handleSync} className="text-indigo-600 font-medium hover:underline flex items-center justify-center gap-2 mx-auto">
              <RefreshCw size={16} /> {t.syncNow}
            </button>
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
                              <button
                                onClick={(e) => handleDeleteLesson(e, lesson.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete Lesson"
                              >
                                <Trash2 size={16} />
                              </button>
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Server URL</label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="http://localhost:8080"
                />
                <p className="text-xs text-slate-400 mt-1">Point this to your LingoLift Server address.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Key</label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  placeholder="Paste your API Key here"
                />
                <p className="text-xs text-slate-400 mt-1">Optional. Required for some server features.</p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  onClick={handleResetSync}
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  Reset Sync History
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Global Review Component ---

const GlobalReview: React.FC = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsMap, setLessonsMap] = useState<Map<string, Lesson>>(new Map());

  // Tag Filtering
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const lessons = await getAllLessons();
    const map = new Map<string, Lesson>();
    const cards: Flashcard[] = [];
    const tags = new Set<string>();
    const now = Date.now();

    lessons.forEach(l => {
      map.set(l.id, l);
      let hasDue = false;

      l.flashcards.forEach(fc => {
        // We only want DUE cards for global review
        if (fc.nextReview <= now) {
          // We attach the lessonId to the object (hacky but effective for in-memory)
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

    // Save to DB
    console.log('[GlobalReview] Saving lesson:', updatedLesson.id);
    await saveLesson(updatedLesson);
    console.log('[GlobalReview] Saved lesson:', updatedLesson.id);
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
          lang={lang}
        />
      </div>
    </div>
  );
};

// Interface to props for the AudioPlayer in the Detail view
interface PlayerControls {
  play: (url: string, title: string) => void;
  pause: () => void;
  isPlaying: boolean;
  currentUrl: string | null;
  mode: PlayMode;
  toggleMode: () => void;
}

const LessonDetail: React.FC<{ playerControls: PlayerControls }> = ({ playerControls }) => {
  const { t, lang } = useLanguage();
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

  const resolveUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const serverUrl = getServerUrl().replace(/\/$/, '');
    return `${serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

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
        setAudioUrl(resolveUrl(data.audioUrl));
      }

      // Determine PDF URL
      if (data.pdfBlob) {
        setPdfUrl(URL.createObjectURL(data.pdfBlob));
      } else if (data.pdfUrl) {
        setPdfUrl(resolveUrl(data.pdfUrl));
      }

      // Determine Markdown Content
      if (data.markdownContent) {
        setMarkdownContent(data.markdownContent);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWord = async () => {
    if (!lesson || !newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }),
      front: newFront,
      back: newBack,
      isUserCreated: true, // Mark as user-created so sync preserves it
      ...createInitialSRSState()
    };

    const updatedLesson = { ...lesson, flashcards: [...lesson.flashcards, newCard] };
    setLesson(updatedLesson);
    await saveLesson(updatedLesson);

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
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
          >
            <Plus size={24} />
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
                <span>• {lesson.flashcards.length} {t.lesson.vocabCount}</span>
                <span>• {lesson.flashcards.filter(c => c.isUserCreated).length} {t.lesson.addedByYou}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.flashcards.slice(0, 5).map(fc => (
                  <span key={fc.id} className="text-xs bg-white px-2 py-1 rounded border border-amber-200 text-amber-900">{fc.front.substring(0, 15)}...</span>
                ))}
                {lesson.flashcards.length > 5 && <span className="text-xs text-amber-600 self-center">+{lesson.flashcards.length - 5} more</span>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'read' && (
          <div className="h-[calc(100vh-180px)] bg-slate-200 rounded-xl border border-slate-300 overflow-hidden">
            {pdfUrl ? (
              <PDFViewer url={pdfUrl} />
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

        {/* REPLACED Simple Text with Markdown */}
        {activeTab === 'vocab' && (
          <div className="pb-24 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {lesson.flashcards.length === 0 ? (
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

// --- Main App Wrapper ---

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.SEQUENTIAL);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  // Player Logic
  const play = useCallback((url: string, title: string) => {
    if (currentAudioUrl !== url) {
      setCurrentAudioUrl(url);
      setCurrentTrackTitle(title);
    }
    setIsPlaying(true);
  }, [currentAudioUrl]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t: translations[lang] }}>
      <HashRouter>
        <div className="font-sans text-slate-900">
          <IOSInstallPrompt />
          <Routes>
            <Route path="/" element={<LessonList />} />
            <Route path="/review" element={<GlobalReview />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route
              path="/lesson/:id"
              element={
                <LessonDetail
                  playerControls={{
                    play,
                    pause,
                    isPlaying,
                    currentUrl: currentAudioUrl,
                    mode: playMode,
                    toggleMode: () => setPlayMode(m => m === PlayMode.SEQUENTIAL ? PlayMode.LOOP_ONE : PlayMode.SEQUENTIAL)
                  }}
                />
              }
            />
          </Routes>

          <AudioPlayer
            audioUrl={currentAudioUrl}
            title={currentTrackTitle}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onNext={handleNext}
            mode={playMode}
            onToggleMode={() => setPlayMode(m => m === PlayMode.SEQUENTIAL ? PlayMode.LOOP_ONE : PlayMode.SEQUENTIAL)}
          />
        </div>
      </HashRouter>
    </LanguageContext.Provider>
  );
};

export default App;