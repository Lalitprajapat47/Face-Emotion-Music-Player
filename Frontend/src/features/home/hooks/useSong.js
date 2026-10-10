import { getSong, getSongList } from "../services/song.api";
import { useContext } from "react";
import { SongContext } from "../song.context";


export const useSong = () => {
    const context = useContext(SongContext)

    const { loading, setLoading, song, setSong, songList, setSongList, isPlaying, setIsPlaying } = context

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

    // Position of the currently selected song inside the browsable list
    // (-1 if it isn't part of it).
    const activeIndex = (songList || []).findIndex((item) =>
        item._id ? item._id === song?._id : item.url === song?.url
    )

    // Move to the previous (-1) or next (+1) record and play it. Stops at
    // either end of the list instead of wrapping around.
    function stepSong(direction) {
        if (!songList || songList.length < 2) return;
        const from = activeIndex === -1 ? 0 : activeIndex
        const target = Math.min(songList.length - 1, Math.max(0, from + direction))
        if (target !== activeIndex) playSong(songList[target])
    }

    return ({ loading, song, songList, handleGetSong, handleGetSongList, playSong, stepSong, activeIndex, isPlaying, setIsPlaying })

}