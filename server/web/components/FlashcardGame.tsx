import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { RotateCw, Check, X, Clock, Brain, ArrowLeftRight, Shuffle, ArrowRight } from 'lucide-react';
import { calculateNextReview, Grade } from '../services/srs';
import { translations, Language } from '../utils/translations';
import { Markdown } from './Markdown';

interface FlashcardGameProps {
  cards: Flashcard[];
  onClose: () => void;
  onUpdateCard: (updatedCard: Flashcard) => void;
  lang: Language;
}

type ReviewMode = 'standard' | 'reverse' | 'mixed';

export const FlashcardGame: React.FC<FlashcardGameProps> = ({ cards, onClose, onUpdateCard, lang }) => {
  const t = translations[lang].game;
  
  // We split cards into "Due" queue
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [completedSession, setCompletedSession] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  
  // Mode State
  const [mode, setMode] = useState<ReviewMode>('mixed'); // Default to mixed for best practice
  // Tracks the orientation of the CURRENT card specifically
  const [isCurrentReversed, setIsCurrentReversed] = useState(false);

  useEffect(() => {
    // Filter for cards due now or in the past
    const now = Date.now();
    const due = cards.filter(c => c.nextReview <= now);
    
    // Shuffle them to prevent order memory
    const shuffled = [...due].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setFinished(false);
    setCompletedSession(0);
    setIsFlipped(false);
    
    // Initialize orientation for first card
    determineNextOrientation('mixed'); 
  }, [cards]);

  const determineNextOrientation = (targetMode: ReviewMode) => {
    if (targetMode === 'standard') setIsCurrentReversed(false);
    else if (targetMode === 'reverse') setIsCurrentReversed(true);
    else if (targetMode === 'mixed') setIsCurrentReversed(Math.random() < 0.5);
  };

  const handleToggleMode = () => {
    let nextMode: ReviewMode = 'standard';
    if (mode === 'standard') nextMode = 'reverse';
    else if (mode === 'reverse') nextMode = 'mixed';
    else nextMode = 'standard';
    
    setMode(nextMode);
    // Immediate update for current card context
    determineNextOrientation(nextMode);
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'standard': return t.mode_standard;
      case 'reverse': return t.mode_reverse;
      case 'mixed': return t.mode_mixed;
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'standard': return <ArrowRight size={16} />;
      case 'reverse': return <ArrowLeftRight size={16} />;
      case 'mixed': return <Shuffle size={16} />;
    }
  };

  const handleRate = (grade: Grade) => {
    if (queue.length === 0) return;

    const currentCard = queue[0];
    const updatedCard = calculateNextReview(currentCard, grade);

    // Save progress to parent (DB)
    onUpdateCard(updatedCard);

    setIsFlipped(false);

    // Delay for animation
    setTimeout(() => {
      let newQueue = [...queue];
      newQueue.shift(); // Remove current

      if (grade === Grade.AGAIN) {
        // Re-insert into queue (e.g., 3 spots later or end)
        const reInsertIndex = Math.min(newQueue.length, 3);
        newQueue.splice(reInsertIndex, 0, currentCard); 
      } else {
        setCompletedSession(prev => prev + 1);
      }

      setQueue(newQueue);
      
      // Determine orientation for the NEW next card
      determineNextOrientation(mode);

      if (newQueue.length === 0) {
        setFinished(true);
      }
    }, 200);
  };

  const handleRestartAll = () => {
    // Force cram mode: just reset queue with all cards regardless of time
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setFinished(false);
    setCompletedSession(0);
    determineNextOrientation(mode);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>{t.noCards}</p>
        <button onClick={onClose} className="mt-4 text-indigo-600 font-medium">{t.goBack}</button>
      </div>
    );
  }

  // If no due cards but we have cards in the deck
  if (queue.length === 0 && !finished) {
     return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <Check size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{t.caughtUpTitle}</h3>
        <p className="text-slate-600 mb-8">{t.caughtUpMsg}</p>
        <div className="flex gap-4">
          <button 
            onClick={handleRestartAll}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-sm active:scale-95 transition-transform"
          >
            {t.reviewAnyway}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium active:scale-95 transition-transform"
          >
            {t.done}
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <Brain size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{t.finished}</h3>
        <p className="text-slate-600 mb-8">{t.reviewed} {completedSession} cards.</p>
        <button 
          onClick={onClose}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
        >
          {t.finishBtn}
        </button>
      </div>
    );
  }

  const currentCard = queue[0];

  // Logic to determine what to show based on `isCurrentReversed`
  // if false: Front (Question) -> Back (Answer)
  // if true: Back (Question) -> Front (Answer)
  
  const questionLabel = isCurrentReversed ? t.definition : t.term;
  const answerLabel = isCurrentReversed ? t.term : t.definition;
  
  const questionContent = isCurrentReversed ? currentCard.back : currentCard.front;
  const answerContent = isCurrentReversed ? currentCard.front : currentCard.back;
  
  // The small text shown above the main answer
  const contextContent = isCurrentReversed ? currentCard.back : currentCard.front;
  const contextLabel = isCurrentReversed ? t.definition : t.term;

  return (
    <div className="flex flex-col h-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Clock size={14} /> {t.due}: {queue.length}
        </span>
        <div className="flex gap-2">
            <button 
                onClick={handleToggleMode} 
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors ${mode === 'mixed' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
                title="Toggle Mode"
            >
                {getModeIcon()}
                {getModeLabel()}
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 relative perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-80 transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Question Side (Visible Initially) */}
          <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-8 backface-hidden z-20">
            <span className="text-xs font-bold tracking-widest text-slate-300 uppercase mb-4 absolute top-8">{questionLabel}</span>
            <div className="text-center w-full overflow-y-auto max-h-full">
                <Markdown content={questionContent} size="xl" className="font-bold text-slate-800 text-center" />
            </div>
            <div className="absolute bottom-6 text-slate-400 flex items-center gap-2 text-sm">
              <RotateCw size={14} /> {t.tapReveal}
            </div>
          </div>

          {/* Answer Side (Visible After Flip) */}
          <div className="absolute w-full h-full bg-indigo-50 border border-indigo-100 rounded-2xl shadow-xl flex flex-col items-center backface-hidden rotate-y-180 z-20 overflow-hidden">
            
            {/* Context (Question Side) shown smaller at top with distinct background */}
            <div className="w-full py-3 px-6 bg-indigo-100/50 border-b border-indigo-100 text-center">
               <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase block mb-1">{contextLabel}</span>
               <div className="line-clamp-2 text-slate-500 text-sm">
                  <Markdown content={contextContent} size="sm" />
               </div>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center p-6 overflow-y-auto">
                <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase mb-2">{answerLabel}</span>
                <Markdown content={answerContent} size="lg" className="font-medium text-slate-800 text-center" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-32 mt-6">
        {!isFlipped ? (
           <button 
           onClick={() => setIsFlipped(true)}
           className="w-full h-16 rounded-xl bg-slate-900 text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
         >
           {t.showAnswer}
         </button>
        ) : (
          <div className="grid grid-cols-4 gap-2 h-full">
            <button 
              onClick={(e) => { e.stopPropagation(); handleRate(Grade.AGAIN); }}
              className="flex flex-col items-center justify-center bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 active:scale-95 transition-all"
            >
              <span className="font-bold">{t.again}</span>
              <span className="text-xs opacity-70 mt-1">1m</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRate(Grade.HARD); }}
              className="flex flex-col items-center justify-center bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 active:scale-95 transition-all"
            >
              <span className="font-bold">{t.hard}</span>
              <span className="text-xs opacity-70 mt-1">2d</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRate(Grade.GOOD); }}
              className="flex flex-col items-center justify-center bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 active:scale-95 transition-all"
            >
              <span className="font-bold">{t.good}</span>
              <span className="text-xs opacity-70 mt-1">4d</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRate(Grade.EASY); }}
              className="flex flex-col items-center justify-center bg-sky-100 text-sky-700 rounded-xl hover:bg-sky-200 active:scale-95 transition-all"
            >
              <span className="font-bold">{t.easy}</span>
              <span className="text-xs opacity-70 mt-1">7d</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};