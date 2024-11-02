// src/GameControls.tsx
import React, { useState } from 'react';
interface JoinControlsProps {
  joinGame: (id: string, amount: number) => void;
  leaveGame: (id: string) => void;
  gameId: string;
}

const JoinControls: React.FC<JoinControlsProps> = ({
    joinGame,
    leaveGame,
    gameId,
}) => {
    const [amount, setAmount] = useState(0);
    const handleJoinGame = () => {
      joinGame(gameId, amount);
    };
  return (
    <div>
      <input
        type="text"
        placeholder="Buy-in amount"
        onChange={(e) => setAmount(parseFloat(e.target.value))}
      />
      <button onClick={handleJoinGame}>Join</button>
    </div>
  );
};

export default JoinControls;