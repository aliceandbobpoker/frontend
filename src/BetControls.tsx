// src/ActionControls.tsx
import React, { useState, forwardRef, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';

import { BetType, ParsedGameState, PlayerState,
} from 'aliceandbob-client';
import { BalanceTransitionProps } from './TopBar';

interface AmountControlProps {
  amount: number;
  minAmount: number;
  maxAmount: number;
  halfPotAmount: number;
  fullPotAmount: number;
  onAmountChange: (amount: number | string) => void;
  valid: boolean;
  error: string;
  disabled: boolean;
}

const AmountControl: React.FC<AmountControlProps> = ({amount, minAmount, maxAmount, halfPotAmount, fullPotAmount, onAmountChange, valid, error, disabled}) => {
  const buttonSx= {
  //   maxHeight: '2vh',
  //  minHeight: '3vh',
   width: '30%',
   minWidth: '0%',
  // minWidth: '2vw',
   fontSize: 'max(0.75vw, 10px)',
   padding: '0',
   margin: '0'
  };
  return (
    <Grid
    sx=
    {{ width: '40%', height: '100%', top: '-1vh', position: 'relative', left: '2vw'
     }}
    //  container
     direction="row"
     justifyContent="flex-start"
     alignItems="stretch"
     >
    <TextField
    error={!valid}
    helperText={error}
    id="outlined-number"
    // label="Amount"
    type="number"
    InputLabelProps={{
      shrink: true,
    }}
    variant="outlined"
    value={amount === 0 ? "" : amount}
    size={'small'}
    disabled={disabled}
    sx={{width: '80%',
      // height: '50%',
      borderRadius: 2,
      // mb: 0
      padding: '0px',
      // mt: '10px',
      // input: { color: 'black' }
    }}
    inputProps={{style: {
      fontSize: 'max(1.5vh, 10px)',
      padding: '0.75vh',
      // marginBottom: 0
    }}}
    onChange={(e) => {
      onAmountChange(e.target.value);
    }}
  />
  <Slider
    aria-label="Small"
    value={amount}
    onChange={(e, v) => onAmountChange(v as number)}
    min={minAmount}
    max={maxAmount}
    step={0.01}
    size={'small'}
    disabled={disabled}
    sx={{width: '80%',
    height: '5%',
    // borderRadius: 2,
    // marginTop: '1%',
    // padding: '2%',
  }}
    valueLabelDisplay="auto"
  />
  <Box sx={{
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  }}>
  <Button disabled={disabled}  style={buttonSx}
variant="outlined" onClick={() => onAmountChange(halfPotAmount)}>
        {`1/2 Pot`}
  </Button>
  <Button disabled={disabled}  style={buttonSx}
variant="outlined" onClick={() => onAmountChange(fullPotAmount)}>
        {`1x Pot`}
  </Button> 
  <Button disabled={disabled}
  // size='small' 
  style={buttonSx}
  variant="outlined" onClick={() => onAmountChange(maxAmount)}>
        {`All In`}
  </Button>
  </Box>
  </Grid>
  )
}

interface BetControlsProps {
  onBet: (amount: number, betType: BetType) => void;
  onCheck: () => void;
  onFold: () => void;
  gameState: ParsedGameState;
  ownState: PlayerState;
  walletBalance: BalanceTransitionProps;
  decimals: number;
  formatAmount: (amount: number) => string;
}

const BetControls: React.FC<BetControlsProps> = forwardRef(({
  onBet,
  onCheck,
  onFold,
  gameState,
  ownState,
  walletBalance,
  decimals,
  formatAmount
}, ref) => {
  const lowBalanceErrorMsg = "Not enough SUI. Please deposit more";
  const [valid, setValid] = useState(true);
  const [error, setError] = useState("");
  const handleBet = (betAmount: number) => {
    // console.log("betAmount: " + betAmount)
    // console.log("ownState.bet: " + ownState.bet);
    const partialAmount = Math.round(betAmount * (10 ** decimals)) - (ownState.bet ? ownState.bet : 0);
    // console.log("partialAmount: " + partialAmount);
    onBet(partialAmount, BetType.BET);
  };
  const handleCall = () => {
    onBet(gameState.callAmount, BetType.CALL);
  };
  const callAmount = formatAmount(gameState.callAmount);
  const callIsAllIn = gameState.callAmount === ownState.balance;
  const canCall = gameState.availableActions.includes(BetType.CALL);
  const canBet = gameState.availableActions.includes(BetType.BET);
  const canCheck = gameState.availableActions.includes(BetType.CHECK);
  const canFold = gameState.availableActions.includes(BetType.FOLD);
  const isRaise = gameState.callAmount > 0 || (gameState.betRound === 0 && gameState.betAmount === gameState.bigBlind);
  const betName = isRaise ? 'Raise to' : 'Bet';
  const ownBet = ownState.bet ? ownState.bet : 0;
  // TODO fix
  const raiseAmount = gameState.raiseAmount;
  const maxBet = (ownState.balance + ownBet) / (10 ** decimals);
  const minBet = Math.min(maxBet, (ownBet + gameState.callAmount + raiseAmount) / (10 ** decimals));
  const minBetPartialAmount = Math.min((ownState.balance + ownBet), (ownBet + gameState.callAmount + raiseAmount)) - ownBet;
  const potAfterCall = gameState.pots[0] + gameState.callAmount;
  const halfPotBet = Math.min(maxBet, (potAfterCall * 0.5 + ownBet + gameState.callAmount) / (10 ** decimals));
  const fullPotBet = Math.min(maxBet, (potAfterCall * 1 + ownBet + gameState.callAmount) / (10 ** decimals));
  const [amount, setAmount] = useState(minBet);

  const haveBalanceForCall = walletBalance.balance >= gameState.callAmount;
  const haveBalanceForMinBet = walletBalance.balance >= minBetPartialAmount;
  console.log("haveBalanceForMinBet: " + haveBalanceForMinBet);
  console.log("walletBalance.balance: " + walletBalance.balance);
  console.log("minBetPartialAmount: " + minBetPartialAmount);
  // const haveBalanceForCall = true;

  const buttonWidth = '6vw';
  const buttonWidth2 = '12vw';
  const buttonSx = {
    width: buttonWidth,
    height: '5vh',
    marginTop: '2vh',
    borderRadius: '20px',
    marginRight: '1vw',
    padding: "0px 0px",
    fontSize: "max(0.9vw, 10px)",
    color: '#90caf9'
  };

  const buttonSx2 = {
    width: buttonWidth2,
    height: '5vh',
    marginTop: '2vh',
    // marginRight: '20px',
    borderRadius: '20px',
    padding: "0px 0px",
    fontSize: "max(0.9vw, 10px)",
    color: '#90caf9'

  };

  const onAmountChange = (amount: number | string) => {

    if (!haveBalanceForMinBet) {
      setValid(false);
      setError(lowBalanceErrorMsg);
      return;
    }
  
    const amountStr = amount + "";
    if (amountStr === "") {
      setAmount(0);
      setValid(false);
    } else {
      const parsed = parseFloat(amount + "");
      if ( parsed < minBet) {
        setValid(false);
        setError(`Bet must be at least ${minBet}`);
      } else if (parsed > maxBet) {
        setValid(false);
        setError(`Bet must be at most ${maxBet}`);
      } else if (parsed > walletBalance.balance / (10 ** decimals)) {
        setValid(false);
        setValid(false);
        setError(lowBalanceErrorMsg);
      } else {
        setValid(true);
        setError("");
      }
      setAmount(parsed);
    }
  };

  useEffect(() => {
    if (canBet) {
      onAmountChange(amount);
    }
  }, [walletBalance.balance, minBet, maxBet]);

  return (
    <Box
    sx = {{
      mt: '3vh',
      width: '100%',

    }}
  display="flex"
  justifyContent="center"
  alignItems="center"
>
  <Box sx= {{
    width: '90%',
    height: '100%',
  opacity: 0.9,
  pointerEvents: "auto",
  justifyContent: 'flex-start',
  display: 'flex'
}}
  >
      {canFold && <Button variant="outlined" onClick={onFold} 
            sx={{...buttonSx,
              backgroundColor: "#737373",
            }}
        >
        Fold
      </Button>}
      {canCall && 
      <Tooltip title={haveBalanceForCall ? "" : lowBalanceErrorMsg}
      sx={{...buttonSx,}}
      followCursor>
         <span>
        <Button variant="outlined" onClick={handleCall}
        disabled={!haveBalanceForCall} 
              sx={{
                ...buttonSx,
                backgroundColor: "#7d3c08",
              }
          }
        >
          {`Call ${callAmount}${callIsAllIn ? " (All-In)" : ""}`}
        </Button>
        </span>
      </Tooltip>
      }
      {canCheck && <Button variant="outlined" onClick={onCheck} 
            sx={{...buttonSx,
              backgroundColor: "#7d3c08",
            }}
        >
        {`Check`}
      </Button>}
      <Tooltip title={(haveBalanceForMinBet || !canBet) ? "" : lowBalanceErrorMsg}
      followCursor>
        <span>
        <Button variant="outlined" 
            disabled={!valid || !canBet || !haveBalanceForMinBet}
            onClick={() => handleBet(amount)}
            sx={{...buttonSx2,
              backgroundColor: "#256605",
            }}
          >
          {canBet ?  `${betName} ${formatAmount(amount * (10 ** decimals))} ${amount === maxBet ? " (All-In)" : ""}` : `${betName}`}
        </Button>
      </span>
      </Tooltip>
      <AmountControl amount={amount}
      minAmount={minBet}
      maxAmount={maxBet}
      halfPotAmount={halfPotBet}
      fullPotAmount={fullPotBet}
      onAmountChange={onAmountChange}
      valid={valid}
      error={error}
      disabled={!canBet}
      />
    {/* </div> */}
    </Box>
    </Box>
  );
});

export default BetControls;