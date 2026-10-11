import { createContext, useRef, useState } from "react";

export const SongContext = createContext();

export const SongContextProvider = ({ children }) => {
  const [song, setSong] = useState({
    url: "https://ik.imagekit.io/hnoglyswo0/cohort-2/moodify/songs/Lady_Singham_gs01DFz-1.mp3",
    posterUrl: "https://ik.imagekit.io/hnoglyswo0/cohort-2/moodify/posters/Lady_Singham_VW8DGJkie.jpeg",
    title: "Lady Singham",
    mood: "happy",
  });

  const [loading, setLoading] = useState(false);
  const [songList, setSongList] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // The <audio> element lives in Player, but the mix page needs to play /
  // pause it too — so the ref is shared through context.
  const audioRef = useRef(null);

  return (
    <SongContext.Provider
      value={{
        song, setSong,
        loading, setLoading,
        songList, setSongList,
        isPlaying, setIsPlaying,
        audioRef,
      }}
    >
      {children}
    </SongContext.Provider>
  );
};