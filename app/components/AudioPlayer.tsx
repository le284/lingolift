import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Repeat, Repeat1, Volume2, ChevronUp } from 'lucide-react';
import { PlayMode } from '../types';

interface AudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  mode: PlayMode;
  onToggleMode: () => void;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  isPlaying,
  onTogglePlay,
  onNext,
  mode,
  onToggleMode,
  title
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration || 1;
      setProgress((audioRef.current.currentTime / duration) * 100);
    }
  };

  const handleEnded = () => {
    if (mode === PlayMode.LOOP_ONE) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      onNext();
    }
  };

  if (!audioUrl) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 shadow-2xl"></div>
      
      <div className="relative safe-area-bottom pt-3 pb-1 px-4">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
        
        <div className="max-w-md mx-auto flex flex-col gap-2 mb-2">
          {/* Progress Bar */}
          <div className="group relative w-full h-3 flex items-center cursor-pointer" onClick={(e) => {
             if (audioRef.current) {
               const rect = e.currentTarget.getBoundingClientRect();
               const x = e.clientX - rect.left;
               const pct = x / rect.width;
               audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
             }
          }}>
             <div className="w-full bg-slate-200 rounded-full h-1">
               <div 
                 className="bg-indigo-600 h-1 rounded-full relative" 
                 style={{ width: `${progress}%` }}
               >
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
             </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <p className="font-semibold text-slate-800 truncate text-sm">{title || 'Playing Audio'}</p>
              <p className="text-xs text-slate-500">LingoLift Player</p>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={onToggleMode}
                className={`p-2 rounded-full transition-colors ${mode === PlayMode.LOOP_ONE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                {mode === PlayMode.LOOP_ONE ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>

              <button 
                onClick={onTogglePlay}
                className="p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-transform hover:bg-indigo-700"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>

              <button 
                onClick={onNext}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <SkipForward size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};