import { SyncRequest, SyncResponse } from "../types";

export const SERVER_URL_KEY = 'lingolift_server_url';

export const getServerUrl = (): string => {
    return localStorage.getItem(SERVER_URL_KEY) || 'http://localhost:8080';
};

export const setServerUrl = (url: string) => {
    localStorage.setItem(SERVER_URL_KEY, url);
};

const getHeaders = () => {
    const apiKey = localStorage.getItem('api_key');
    return {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    };
};

/**
 * Perform Bi-Directional Sync with Configurable Server
 */
export const performBiDirectionalSync = async (request: SyncRequest): Promise<SyncResponse> => {
    const baseUrl = getServerUrl();
    // Ensure no trailing slash
    const cleanUrl = baseUrl.replace(/\/$/, '');

    try {
        const response = await fetch(`${cleanUrl}/api/sync`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Sync failed with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Sync Network Error:", error);
        throw error;
    }
};
