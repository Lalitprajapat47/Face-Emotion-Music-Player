import React from "react";
import { createContext, useState } from "react";

export const songContext = createContext();

export const SongContextProvider = ({ children }) => {
  const [song, setSong] = useState(null);

  return (
    <songContext.Provider value={{ song, setSong }}>
      {children}
    </songContext.Provider>
  );
};