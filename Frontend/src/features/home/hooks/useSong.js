import { getSong, getSongList } from "../services/song.api";
import { useContext } from "react";
import { SongContext } from "../song.context";


export const useSong = () => {
    const context = useContext(SongContext)

    const { loading, setLoading, song, setSong, songList, setSongList } = context

    // Default behaviour — unchanged: fetches one song for the mood and
    // plays it immediately.
    async function handleGetSong({ mood }) {
        if (!mood) return;

        setLoading(true)

        try {
            const data = await getSong({ mood })
            if (!data?.song) {
                console.warn(`No song found for mood: ${mood}`)
                setLoading(false)
                return
            }
            setSong(data.song)
        } catch (error) {
            console.error('Failed to fetch song:', error)
        } finally {
            setLoading(false)
        }
    }

    // Additional — fetches every song matching the mood so the user can
    // browse and pick a different one than the auto-played default.
    async function handleGetSongList({ mood }) {
        if (!mood) return;

        try {
            const data = await getSongList({ mood })
            setSongList(data?.songs || [])
        } catch (error) {
            console.error('Failed to fetch song list:', error)
        }
    }

    // Lets the song list (or any other UI) switch the currently playing song.
    function playSong(selectedSong) {
        if (!selectedSong) return;
        setSong(selectedSong)
    }

    return ({ loading, song, songList, handleGetSong, handleGetSongList, playSong })

}