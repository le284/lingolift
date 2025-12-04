import React, { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';

export const IOSInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window as any).navigator.standalone;

    // Only show if on iOS and NOT standalone
    if (isIOS && !isStandalone) {
      // Small delay to not be annoying immediately
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl z-[60] animate-fade-in-up border border-slate-700/50">
      <button 
        onClick={() => setShowPrompt(false)} 
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
           {/* App Icon Placeholder */}
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <div>
          <h3 className="font-bold text-sm mb-1">Install LingoLift</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Install this app on your iPhone for a better, fullscreen offline experience.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col gap-2 text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-white">1</span>
          <span>Tap the <Share size={14} className="inline mx-1" /> Share button below</span>
        </div>
        <div className="flex items-center gap-3">
           <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-white">2</span>
          <span>Select <span className="font-bold text-white">Add to Home Screen</span></span>
        </div>
      </div>
      
      {/* Little triangle pointing down to the share button area approximately */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/90 rotate-45 border-r border-b border-slate-700/50"></div>
    </div>
  );
};