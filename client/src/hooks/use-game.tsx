import { createContext, useContext, useState, type ReactNode } from "react";

export type GameType = "mtg" | "fab";

export interface GameInfo {
  key: GameType;
  name: string;
  nameCn: string;
  icon: string;
}

export const GAMES: GameInfo[] = [
  { key: "mtg", name: "Magic: The Gathering", nameCn: "万智牌", icon: "MTG" },
  { key: "fab", name: "Flesh and Blood", nameCn: "血肉之躯", icon: "FAB" },
];

interface GameContextType {
  game: GameType;
  gameInfo: GameInfo;
  setGame: (game: GameType) => void;
}

const GameContext = createContext<GameContextType>({
  game: "mtg",
  gameInfo: GAMES[0],
  setGame: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameType>(() => {
    const saved = localStorage.getItem("selected_game");
    return (saved === "fab" ? "fab" : "mtg") as GameType;
  });

  const handleSetGame = (g: GameType) => {
    setGame(g);
    localStorage.setItem("selected_game", g);
  };

  const gameInfo = GAMES.find(gi => gi.key === game) || GAMES[0];

  return (
    <GameContext.Provider value={{ game, gameInfo, setGame: handleSetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
