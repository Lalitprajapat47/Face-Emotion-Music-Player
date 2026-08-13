import axios from "axios";

const api = axios.create({
    // Prefer explicit VITE_API_URL (set in Render). If missing, fall back to
    // the deployed backend URL so the production site doesn't try localhost.
    baseURL: import.meta.env.VITE_API_URL || "https://face-emotion-music-player.onrender.com",
    withCredentials: true
})

export async function getSong({ mood }) {
    // log the effective base URL for debugging in the browser console
    try { console.debug('API baseURL:', api.defaults.baseURL) } catch (e) {}
    const response = await api.get(`/api/songs?mood=${encodeURIComponent(mood)}`)
    return response.data
}