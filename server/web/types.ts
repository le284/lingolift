export interface Flashcard {
  id: string;
  front: string;
  back: string;
  isUserCreated?: boolean; // New field: true if added by user on device

  // SRS (Spaced Repetition System) Metadata
  interval: number;   // Current interval in days
  repetition: number; // Number of successful reviews
  efactor: number;    // Easiness factor (usually starts at 2.5)
  nextReview: number; // Timestamp for next review

  // Sync Metadata
  lastUpdated: number; // Timestamp of when this card state was last modified
}

export interface Lesson {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  createdAt: number;
  tags?: string[];

  // Media handling
  audioUrl?: string;
  pdfUrl?: string;
  markdownContent?: string;

  audioBlob?: Blob; // Legacy / Local cache
  pdfBlob?: Blob;   // Legacy / Local cache

  flashcards: Flashcard[];
}

export enum PlayMode {
  SEQUENTIAL = 'SEQUENTIAL',
  LOOP_ONE = 'LOOP_ONE',
}

export interface PlayerState {
  currentLessonId: string | null;
  isPlaying: boolean;
  mode: PlayMode;
  currentTime: number;
  duration: number;
}

// --- SYNC INTERFACES ---

export interface CardProgress {
  cardId: string;
  interval: number;
  repetition: number;
  efactor: number;
  nextReview: number;
  lastUpdated: number;
}

export interface NewUserCard {
  lessonId: string;
  card: Flashcard;
}

export interface SyncRequest {
  lastSyncTimestamp: number;
  changes: {
    createdCards: NewUserCard[];
    progressUpdates: CardProgress[];
  };
}

export interface SyncResponse {
  serverTimestamp: number;
  updates: {
    lessons: Lesson[]; // Full lesson updates or new lessons
    remoteProgress: CardProgress[]; // Progress from other devices
  };
}