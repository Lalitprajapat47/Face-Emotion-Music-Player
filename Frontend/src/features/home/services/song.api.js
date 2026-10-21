import axios from "axios";

const api = axios.create({
    // Same rule as auth.api.js: relative URLs by default (Vite proxies /api to
    // the backend in development; in the Docker deploy the API is on the same
    // origin). Set VITE_API_URL only if you want to point at another backend.
    baseURL: import.meta.env.VITE_API_URL ?? "",
    withCredentials: true
})

export async function getSong({ mood }) {
    // log the effective base URL for debugging in the browser console
    try { console.debug('API baseURL:', api.defaults.baseURL) } catch (e) {}
    const response = await api.get(`/api/songs?mood=${encodeURIComponent(mood)}`)
    return response.data
}

export async function getSongList({ mood }) {
    const response = await api.get(`/api/songs/list?mood=${encodeURIComponent(mood)}`)
    return response.data
}