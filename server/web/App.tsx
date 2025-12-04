import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PlayMode } from './types';
import { AudioPlayer } from './components/AudioPlayer';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { translations } from './utils/translations';

// Pages & Components
import { LessonList } from './components/LessonList';
import { LessonDetail } from './components/LessonDetail';
import { Vocabulary } from './pages/Vocabulary';
import { CreateLesson } from './pages/CreateLesson';
import { GlobalReview } from './pages/GlobalReview';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.SEQUENTIAL);

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
    <div className="font-sans text-slate-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <ProtectedRoute>
            <LessonList />
          </ProtectedRoute>
        } />

        <Route path="/lesson/:id" element={
          <ProtectedRoute>
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
          </ProtectedRoute>
        } />

        <Route path="/create" element={
          <ProtectedRoute>
            <CreateLesson />
          </ProtectedRoute>
        } />

        <Route path="/edit/:id" element={
          <ProtectedRoute>
            <CreateLesson />
          </ProtectedRoute>
        } />

        <Route path="/vocabulary" element={
          <ProtectedRoute>
            <Vocabulary />
          </ProtectedRoute>
        } />

        <Route path="/review" element={
          <ProtectedRoute>
            <GlobalReview />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}