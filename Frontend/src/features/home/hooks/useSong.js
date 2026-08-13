import { getSong } from "../services/song.api";
import { useContext } from "react";
import { SongContext } from "../song.context";


export const useSong = () => {
    const context = useContext(SongContext)

    const { loading, setLoading, song, setSong } = context

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

    return ({ loading, song, handleGetSong })

}