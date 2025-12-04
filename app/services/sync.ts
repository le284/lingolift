import { getAllLessons, saveLesson, deleteLesson, getDeletedLessonIds, getDeletedCardIds, getLesson } from './db';
import { Lesson, Flashcard, SyncRequest, SyncResponse, NewUserCard, CardProgress } from '../types';
import { performBiDirectionalSync } from './api';

const LAST_SYNC_KEY = 'last_sync_timestamp';

export const syncLessons = async () => {
    const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
    const lessons = await getAllLessons();

    // 1. Prepare Upstream Changes
    const createdCards: NewUserCard[] = [];
    const modifiedCards: Flashcard[] = [];
    const progressUpdates: CardProgress[] = [];

    lessons.forEach(lesson => {
        lesson.flashcards.forEach(card => {
            // New cards created by user
            if (card.isUserCreated && card.lastUpdated > lastSync) {
                createdCards.push({ lessonId: lesson.id, card });
            }

            // Modified cards (content updated)
            if (card.lastUpdated > lastSync) {
                modifiedCards.push(card);
            }

            // Progress updates (SRS)
            if (card.lastUpdated > lastSync) {
                progressUpdates.push({
                    cardId: card.id,
                    interval: card.interval,
                    repetition: card.repetition,
                    efactor: card.efactor,
                    nextReview: card.nextReview,
                    lastUpdated: card.lastUpdated
                });
            }
        });
    });

    const deletedCardIds = await getDeletedCardIds(lastSync);
    const deletedLessonIds = await getDeletedLessonIds(lastSync);

    console.log('[Sync] Last Sync:', lastSync);
    console.log('[Sync] Deleted Lesson IDs found:', deletedLessonIds);

    const req: SyncRequest = {
        lastSyncTimestamp: lastSync,
        changes: {
            createdCards,
            modifiedCards,
            deletedCardIds,
            deletedLessonIds,
            progressUpdates
        }
    };

    try {
        const data = await performBiDirectionalSync(req);

        // 2. Process Downstream Updates

        // A. Deleted Lessons (Server -> Client)
        if (data.updates.deletedLessonIds) {
            for (const id of data.updates.deletedLessonIds) {
                // "Word library need not be sync deleted"
                // We delete the lesson, but if we wanted to preserve words, we'd do it here.
                // For now, we follow the standard deletion protocol.
                await deleteLesson(id);
            }
        }

        // B. Deleted Cards
        if (data.updates.deletedCardIds) {
            const allLessons = await getAllLessons();
            for (const lesson of allLessons) {
                const originalLen = lesson.flashcards.length;
                lesson.flashcards = lesson.flashcards.filter(c => !data.updates.deletedCardIds.includes(c.id));
                if (lesson.flashcards.length !== originalLen) {
                    await saveLesson(lesson);
                }
            }
        }

        // C. New/Updated Lessons
        for (const remoteLesson of data.updates.lessons) {
            await saveLesson(remoteLesson);
        }

        // D. Remote Progress
        for (const update of data.updates.remoteProgress) {
            const allLessons = await getAllLessons();
            for (const lesson of allLessons) {
                const card = lesson.flashcards.find(c => c.id === update.cardId);
                if (card) {
                    if (update.lastUpdated > card.lastUpdated) {
                        card.interval = update.interval;
                        card.repetition = update.repetition;
                        card.efactor = update.efactor;
                        card.nextReview = update.nextReview;
                        card.lastUpdated = update.lastUpdated;
                        await saveLesson(lesson);
                    }
                }
            }
        }

        localStorage.setItem(LAST_SYNC_KEY, data.serverTimestamp.toString());
        return data;
    } catch (err) {
        console.error("Sync failed", err);
        throw err;
    }
};

export const resetSyncTime = () => {
    localStorage.removeItem(LAST_SYNC_KEY);
};
