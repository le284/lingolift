import { Lesson, Flashcard, SyncRequest, NewUserCard, CardProgress } from "../types";
import { getAllLessons, saveLesson } from "./db";
import { performBiDirectionalSync } from "./api";

const SYNC_KEY = 'lingolift_last_sync';

export const getLastSyncTime = (): number => {
  return parseInt(localStorage.getItem(SYNC_KEY) || '0', 10);
};

export const setLastSyncTime = (ts: number) => {
  localStorage.setItem(SYNC_KEY, ts.toString());
};

/**
 * Bi-Directional Sync Implementation
 */
export const syncLessons = async (): Promise<void> => {
  try {
    const lastSync = getLastSyncTime();
    const localLessons = await getAllLessons();

    // 1. Gather Local Changes (Upstream Payload)
    const createdCards: NewUserCard[] = [];
    const progressUpdates: CardProgress[] = [];

    for (const lesson of localLessons) {
      for (const fc of lesson.flashcards) {
        // If modified since last sync
        if (fc.lastUpdated > lastSync) {
          if (fc.isUserCreated) {
            createdCards.push({ lessonId: lesson.id, card: fc });
          } else {
            progressUpdates.push({
              cardId: fc.id,
              interval: fc.interval,
              repetition: fc.repetition,
              efactor: fc.efactor,
              nextReview: fc.nextReview,
              lastUpdated: fc.lastUpdated
            });
          }
        }
      }
    }

    const request: SyncRequest = {
      lastSyncTimestamp: lastSync,
      changes: { createdCards, progressUpdates }
    };

    // 2. Perform Network Request
    const response = await performBiDirectionalSync(request);

    // 3. Process Downstream Updates
    
    // Create a map of local lessons for merging
    const localLessonMap = new Map(localLessons.map(l => [l.id, l]));
    
    // Create a map of Remote Progress for O(1) lookup
    const remoteProgressMap = new Map(
      response.updates.remoteProgress.map(p => [p.cardId, p])
    );

    // Iterate over Server Lessons (Content Authority)
    for (const serverLesson of response.updates.lessons) {
      const localLesson = localLessonMap.get(serverLesson.id);
      
      let finalFlashcards: Flashcard[] = [];

      if (localLesson) {
        // --- MERGE STRATEGY ---
        
        const localCardMap = new Map(localLesson.flashcards.map(fc => [fc.id, fc]));

        // A. Process Server Cards (The content source of truth)
        const mergedServerCards = serverLesson.flashcards.map(serverFc => {
          const localFc = localCardMap.get(serverFc.id);
          const remoteProg = remoteProgressMap.get(serverFc.id);

          // Start with Server Content (Text)
          let finalFc = { ...serverFc };

          // Determine who has the latest progress: Local vs Remote vs ServerDefault
          // If we have remote progress from another device, and it's newer than local...
          if (remoteProg && (!localFc || remoteProg.lastUpdated > localFc.lastUpdated)) {
             finalFc = { ...finalFc, ...remoteProg }; // Apply remote progress
          } 
          // Else if we have local progress that is valid...
          else if (localFc) {
             finalFc = {
               ...finalFc,
               // Keep local SRS stats
               interval: localFc.interval,
               repetition: localFc.repetition,
               efactor: localFc.efactor,
               nextReview: localFc.nextReview,
               lastUpdated: localFc.lastUpdated
             };
          }
          // Else use default server state (new card)

          return finalFc;
        });

        // B. Preserve Local User-Created Cards
        // (In a real app, we would verify if server accepted them, but here we just keep local copies)
        const userCards = localLesson.flashcards.filter(fc => fc.isUserCreated);
        
        finalFlashcards = [...mergedServerCards, ...userCards];

      } else {
        // New Lesson
        finalFlashcards = serverLesson.flashcards;
      }

      // Construct final lesson object
      const mergedLesson: Lesson = {
        ...serverLesson,
        // Preserve downloaded blobs if they exist locally
        audioBlob: localLesson?.audioBlob,
        pdfBlob: localLesson?.pdfBlob,
        flashcards: finalFlashcards
      };

      await saveLesson(mergedLesson);
    }

    // 4. Update Sync Timestamp
    setLastSyncTime(response.serverTimestamp);

  } catch (error) {
    console.error("Sync failed:", error);
    throw error;
  }
};