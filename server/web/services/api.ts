import { Lesson } from "../types";

/**
 * Create a new lesson on the server with file uploads
 */
export const createLesson = async (formData: FormData): Promise<Lesson> => {
    const response = await fetch('/api/lessons', {
        method: 'POST',
        body: formData, // Fetch automatically sets Content-Type to multipart/form-data
    });

    if (!response.ok) {
        throw new Error(`Create lesson failed with status: ${response.status}`);
    }

    return await response.json();
};

export const updateLesson = async (id: string, formData: FormData): Promise<Lesson> => {
    const response = await fetch(`/api/lessons/${id}`, {
        method: 'PUT',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Update lesson failed with status: ${response.status}`);
    }

    return await response.json();
};

export const deleteLesson = async (id: string): Promise<void> => {
    const response = await fetch(`/api/lessons/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Delete lesson failed with status: ${response.status}`);
    }
};

export const createCard = async (card: any): Promise<any> => {
    const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
    });
    if (!response.ok) throw new Error('Failed to create card');
    return await response.json();
};

export const updateCard = async (id: string, data: { front: string; back: string }): Promise<void> => {
    const response = await fetch(`/api/cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update card');
};

export const deleteCard = async (id: string): Promise<void> => {
    const response = await fetch(`/api/cards/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete card');
};

export const getLessons = async (): Promise<Lesson[]> => {
    const response = await fetch('/api/lessons');
    if (!response.ok) throw new Error('Failed to fetch lessons');
    return await response.json();
};
