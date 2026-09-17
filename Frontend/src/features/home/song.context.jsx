import { createContext, useState, useEffect } from "react";
import { getSong } from "./services/song.api";

export const SongContext = createContext();

export const SongContextProvider = ({ children }) => {
  const [song, setSong] = useState({
    url: "https://ik.imagekit.io/hnoglyswo0/cohort-2/moodify/songs/Lady_Singham_gs01DFz-1.mp3",
    posterUrl: "https://ik.imagekit.io/hnoglyswo0/cohort-2/moodify/posters/Lady_Singham_VW8DGJkie.jpeg",
    title: "Lady Singham",
    mood: "happy",
  });

  const [loading, setLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState("happy");

  // Mood ke mutabiq backend se song fetch karne ka function
  const fetchSongByMood = async (moodName) => {
    if (!moodName) return;
    try {
      setLoading(true);
      const cleanMood = moodName.toLowerCase();
      setCurrentMood(cleanMood);

      // Backend API call (passing { mood } as expected by your api.js)
      const data = await getSong({ mood: cleanMood });
      
      // Response structure handling (object ya array)
      const targetSong = data?.song || (Array.isArray(data) ? data[0] : data);

      if (targetSong && (targetSong.url || targetSong.audioUrl)) {
        setSong(targetSong);
      }
    } catch (err) {
      console.error("Error fetching song for mood:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SongContext.Provider
      value={{ song, setSong, loading, setLoading, currentMood, fetchSongByMood }}
    >
      {children}
    </SongContext.Provider>
  );
};