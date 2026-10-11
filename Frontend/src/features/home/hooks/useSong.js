import { getSong, getSongList } from "../services/song.api";
import { useContext } from "react";
import { SongContext } from "../song.context";


export const useSong = () => {
    const context = useContext(SongContext)

    const {
        loading, setLoading,
        song, setSong,
        songList, setSongList,
        isPlaying, setIsPlaying,
        audioRef,
    } = context

    // Fetches one song for the mood and plays it immediately.
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

    // Fetches every song matching the mood and returns them, so the caller
    // can decide what to do when the list is empty.
    async function handleGetSongList({ mood }) {
        if (!mood) return [];

        try {
            const data = await getSongList({ mood })
            const songs = data?.songs || []
            setSongList(songs)
            return songs
        } catch (error) {
            console.error('Failed to fetch song list:', error)
            return []
        }
    }

    // Switch the currently selected song (Player auto-plays on change).
    function playSong(selectedSong) {
        if (!selectedSong) return;
        setSong(selectedSong)
    }

    // Position of the currently selected song inside the browsable list
    // (-1 if it isn't part of it).
    const activeIndex = (songList || []).findIndex((item) =>
        item._id ? item._id === song?._id : item.url === song?.url
    )

    // Move to the previous (-1) or next (+1) song and play it. Stops at
    // either end of the list instead of wrapping around.
    function stepSong(direction) {
        if (!songList || songList.length < 2) return;
        const from = activeIndex === -1 ? 0 : activeIndex
        const target = Math.min(songList.length - 1, Math.max(0, from + direction))
        if (target !== activeIndex) playSong(songList[target])
    }

    // Play / pause whatever is loaded in the Player.
    function togglePlayback() {
        const audio = audioRef?.current
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch(() => {})
        } else {
            audio.pause()
        }
    }

    return ({
        loading, song, songList,
        handleGetSong, handleGetSongList,
        playSong, stepSong, activeIndex,
        isPlaying, setIsPlaying,
        audioRef, togglePlayback,
    })

}