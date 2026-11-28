import axios from "axios";

const api = axios.create({
    baseURL:"",
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