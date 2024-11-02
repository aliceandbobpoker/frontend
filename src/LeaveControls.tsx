// src/GameControls.tsx
import React from 'react';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface LeaveControlsProps {
  leaveGame: () => void;
  disabled: boolean;
}

const LeaveControls: React.FC<LeaveControlsProps> = ({
    leaveGame,
    disabled
}) => {
  const text = disabled ? "Leaving Game Next Hand" : "Leave Game";
  return (
    <Box
    sx = {{
      mt: '10vh',
      height: '3vh',
      width: '20%',
      minWidth: '100px',
      mr: '1vw',

    }}
  display="flex"
  justifyContent="left"
  alignItems="left"
    >
    <Button variant="contained" disabled={disabled} onClick={leaveGame}
    sx={{
      fontSize: 'max(0.8vw, 10px)',
      // width: '80%',
      // padding: '2vh'
    }}
    >{text}</Button>
    </Box>
  );
};

export default LeaveControls;