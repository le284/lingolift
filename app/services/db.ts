import { Lesson } from '../types';

const DB_NAME = 'LingoLiftDB';
const STORE_NAME = 'lessons';
const VERSION = 3;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('deleted_lessons')) {
        db.createObjectStore('deleted_lessons', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('deleted_cards')) {
        db.createObjectStore('deleted_cards', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveLesson = async (lesson: Lesson): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(lesson);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllLessons = async (): Promise<Lesson[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getLesson = async (id: string): Promise<Lesson | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteLesson = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, 'deleted_lessons'], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const deletedStore = tx.objectStore('deleted_lessons');

    store.delete(id);
    deletedStore.put({ id, timestamp: Date.now() });
    console.log('[DB] Deleted lesson:', id, 'at', Date.now());

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getDeletedLessonIds = async (since: number): Promise<string[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deleted_lessons', 'readonly');
    const store = tx.objectStore('deleted_lessons');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as { id: string; timestamp: number }[];
      console.log('[DB] All deleted lessons in store:', results);
      console.log('[DB] Filtering with since:', since);
      resolve(results.filter(r => r.timestamp > since).map(r => r.id));
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveDeletedCardId = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deleted_cards', 'readwrite');
    const store = tx.objectStore('deleted_cards');
    store.put({ id, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getDeletedCardIds = async (since: number): Promise<string[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deleted_cards', 'readonly');
    const store = tx.objectStore('deleted_cards');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as { id: string; timestamp: number }[];
      resolve(results.filter(r => r.timestamp > since).map(r => r.id));
    };
    request.onerror = () => reject(request.error);
  });
};
