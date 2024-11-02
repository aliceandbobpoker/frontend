// src/GameControls.tsx

import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';

export type StartGameParams = {
  smallBlind: number,
  bigBlind: number,
}


interface GameControlsProps {
  onStartNewGame: (params: StartGameParams ) => void;
  disabledReason: string | null;
}

export interface StartGameDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (params: StartGameParams) => void;
}


export function StartGameDialog(props: StartGameDialogProps) {

  const textFieldStyle = {style: {fontSize: 15}};

  const { onClose, open, onStart } = props;
  const [smallBlind, setSmallBlind] = useState("");
  const [bigBlind, setBigBlind] = useState("");
  const [valid, setValid] = useState(true);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(true);
  const handleClick = () => {
    onStart({smallBlind: parseFloat(smallBlind) * (10 ** 9), bigBlind: parseFloat(bigBlind) * (10 ** 9)});
    onClose();
  };

  const validateBlinds = (smallBlind: string, bigBlind: string) => {
    if (smallBlind === "" || bigBlind === "") {
      setValid(true);
      setDisabled(true);
      setError("");
    }
    else if (parseFloat(smallBlind) > parseFloat(bigBlind)) {
      setValid(false);
      setDisabled(true);
      setError("small blind cannot exceed big blind");
    } else {
      setValid(true);
      setDisabled(false);
      setError("");
    }
  };


  return (
    <Dialog
    fullWidth
    maxWidth="sm"
    onClose={onClose}
    sx={{ gap: 2 }}
    open={open}>
      <DialogTitle sx={{ }} id="customized-dialog-title">

      New Game
        </DialogTitle>
      <DialogContent>
      <TextField
        error = {!valid}
        id="outlined-basic"
        label="small blind"
        variant="outlined"
        type="number"
        // helperText={error}
        value={smallBlind}
        onChange={(e) => {
          if (e.target.value === "" || parseFloat(e.target.value) >= 0) {
            setSmallBlind(e.target.value);
            validateBlinds(e.target.value, bigBlind);
          } else {
            setSmallBlind("0");
            validateBlinds("0", bigBlind);
          }
        }}
        inputProps={textFieldStyle}
        InputLabelProps={textFieldStyle}
        sx={{ width: '100%', mb: 2, mt: 2 }}
        
      />
      <br></br>
      <TextField
        error={!valid}
        id="outlined-basic"
        label="big blind"
        variant="outlined"
        type={"number"}
        helperText={error}
        value={bigBlind}
        onChange={(e) => {
          if (e.target.value === "" || parseFloat(e.target.value) >= 0) {
            setBigBlind(e.target.value);
            validateBlinds(smallBlind, e.target.value);
          } else {
            setBigBlind("0");
            validateBlinds(smallBlind, "0");
          }
        }
        }
        InputLabelProps={textFieldStyle}
        inputProps={textFieldStyle}
        sx={{ width: '100%', mb: 2 }}
      />
      <Stack  direction="column"
        justifyContent="center"
        alignItems="flex-end"
        spacing={2}>
      <Button variant={"contained"}  disabled={disabled} onClick={handleClick}
      >Create Game</Button>
      </Stack>

      </DialogContent>
    </Dialog>
  );
}

const GameControls: React.FC<GameControlsProps> = ({
  onStartNewGame,
  disabledReason
}) => {

    const [open, setOpen] = useState(false);
    const handleClickOpen = () => {
      setOpen(true);
    };

    const handleClose = () => {
      setOpen(false);
    };

  return (
      <Grid container justifyContent="center"
      sx= {{
        mt: 5,
        mb: 10,
      }}
      >

      {
        (disabledReason) ? (
          <Tooltip title={disabledReason}>
            <span>
            <Button variant="contained" disabled size={"large"}
            >
              New Game
            </Button>
            </span>
          </Tooltip>
        ) : (
          <Button variant="contained" onClick={handleClickOpen} size={"large"}
          >
            New Game
          </Button>
        )
      }
      <StartGameDialog
        open={open}
        onClose={handleClose}
        onStart={onStartNewGame}
      />
  </Grid>
  );
};

export default GameControls;