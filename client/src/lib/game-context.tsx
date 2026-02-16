import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type GameType = "mtg" | "fab";

interface GameContextType {
  game: GameType;
  setGame: (game: GameType) => void;
  gameName: string;
}

const GameContext = createContext<GameContextType>({
  game: "mtg",
  setGame: () => {},
  gameName: "Magic: The Gathering",
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGameState] = useState<GameType>(() => {
    const saved = localStorage.getItem("selected_game");
    return (saved === "fab" ? "fab" : "mtg") as GameType;
  });

  const setGame = (g: GameType) => {
    setGameState(g);
    localStorage.setItem("selected_game", g);
  };

  const gameName = game === "mtg" ? "Magic: The Gathering" : "Flesh and Blood";

  return (
    <GameContext.Provider value={{ game, setGame, gameName }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
