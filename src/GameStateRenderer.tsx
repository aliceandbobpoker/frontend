// src/GameStateRenderer.tsx
import React, { useState } from 'react';
// import './App.css';

import TextField from '@mui/material/TextField';
import { Unstable_Popup as BasePopup } from '@mui/base/Unstable_Popup';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';

import { styled, css, Theme } from '@mui/system';
import CountUp from 'react-countup';

import { CardRank, PrivateState, BetTypeInt, cardToReadable, GameEvent, ParsedGameState } from 'aliceandbob-client';
import { SuiType } from './SuiType';
import { Settings } from './Settings';
import { Jdenticon } from './Jdenticon';
import { useTheme } from '@mui/material/styles';

const USE_SEATS = [0,1,2,3,4,5,6,7];

export type JoinGameParams = {
  balance: number,
  seat: number,
}


export interface JoinGameDialogProps {
  open: boolean;
  gameState: ParsedGameState;
  formatAmount: (amount: number) => string;
  onClose: () => void;
  onJoin: (balance: number) => void;
}

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const BetBody = styled('div')(
  ({ theme }) => `
  left: 15%;
  width: max-content;
  padding: 0.4vh 0.4vw;
  margin: 1vh;
  border-radius: 3vh;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  background-color: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  opacity: 0.6;
  box-shadow: ${
    theme.palette.mode === 'dark'
      ? `0px 4px 8px rgb(0 0 0 / 0.7)`
      : `0px 4px 8px rgb(0 0 0 / 0.1)`
  };
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 2vh;
  z-index: 3;
`,
);

const PopupBody = styled('div')(
  ({ theme }) => `
  width: max-content;
  padding: 0.3vh 0.3vw;
  border-radius: 8px;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  background-color: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  box-shadow: ${
    theme.palette.mode === 'dark'
      ? `0px 4px 8px rgb(0 0 0 / 0.7)`
      : `0px 4px 8px rgb(0 0 0 / 0.1)`
  };
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: max(1.5vh, 9px);
  z-index: 1;
`,
);

const PayoutPopupBody = styled('div')(
  ({ theme }) => `
  width: max-content;
  padding: 5px 5px;
  border-radius: 8px;
  box-shadow: 0 0px 10px #FFFF00;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  background-color: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: max(1.5vh, 9px);
  z-index: 1;
`,
);

const Anchor = styled('span')(
  ({ theme }: { theme: Theme }) => css`
    display: inline-block;
    border-radius: 0.1rem;
    position: relative;
    height: 5%;
    font-size: 1px;
  `,
);


function EventDisplay(props: {events: PlayerEvent[], anchor: HTMLElement | null, formatAmount: (amount: number) => string}) {
  const { events, anchor, formatAmount } = props;
  const eventsArePayoutEvents = (events.length > 0) && events.every((event) => event.type === GameEvent.PayoutEvent);

  const formatEvents = (events: PlayerEvent[]) : string | null =>  {
    if (events.length === 0) {
      return null;
    }
    // if (!event) {
    //   return null;
    // }
    if (events.length === 1) {
      const event = events[0];
      switch (event.type) {
        case GameEvent.AddBetEvent:
          // blind
          if (event.values.bet_type === BetTypeInt.BLIND_BET) {
            return null;
          }
          else if (event.values.bet_type === BetTypeInt.CALL) {
            return `call`
          }
          if (event.values.is_raise) {
            return `raise to ${formatAmount(event.values.total_amount)}`;
          } else {
            return `bet ${formatAmount(event.values.amount)}`;
          };
        case GameEvent.AddCheckEvent:
          return `check`;
        case GameEvent.AddFoldEvent:
          return `fold`;
        case GameEvent.PayoutEvent:
          return `won ${formatAmount(event.values.amount)} SUI`;
        default:
          return null;
      }
    }
    else {
      if (eventsArePayoutEvents) {
        const total = events.reduce((acc, event) => acc + parseInt(event.values.amount), 0);
        return `won ${formatAmount(total)}`;
      }
      // check that all events should be type PayoutEvent
      // for (const event of events) {
      //   if (event.type !== GameEvent.PayoutEvent) {
      //     throw new Error('multiple events should all be PayoutEvent, not ' + event.type);
      //   }
      // }
      // const total = events.reduce((acc, event) => acc + event.values.amount, 0);
      // return `won ${formatAmount(total)}`;
    }
    return null;
  };

  const formatted = formatEvents(events);
  const getPopup = () => {
    if (eventsArePayoutEvents) {
      return (
        <PayoutPopupBody
        className="event-display floating">
           {formatted}
          </PayoutPopupBody>
      );
    } else {
      return (
        <PopupBody
        className="event-display">
           {formatted}
          </PopupBody>
      );
    }
  }
  
  if (!formatted) {
    return <div></div>;
  } 
  else {
    return (
      <div className='eveasdfnt-display'>
        <BasePopup id="event-display"
        open={true}
        anchor={anchor}
        placement="bottom"
        >
          {getPopup()}
        </BasePopup>
    </div>
    );
  }
}

function JoinGameDialog(props: JoinGameDialogProps) {
  const { gameState, formatAmount, onJoin } = props;
  const [balance, setBalance] = useState("");
  const [valid, setValid] = useState(true);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(true);
  const validateStack = (stack: string) => {
    if (stack === "") {
      setValid(true);
      setDisabled(true);
      setError("");
    }
    else if (parseFloat(stack) <= parseFloat(formatAmount(gameState.bigBlind))) {
      setValid(false);
      setDisabled(true);
      setError("buy-in must be greater than the big blind");
    }
    else {
      setValid(true);
      setDisabled(false);
      setError("");
    }
  };

  return (
      <Box
      m={2}
      sx={{
        borderRadius: 100,
        width: '200px',
      }}
      >
      {/* <DialogTitle
      sx ={{
        textAlign: 'center',
      }}
      >Sit Down</DialogTitle> */}
      <TextField
        error = {!valid}
        id="outlined-basic"
        label="buy-in"
        variant="outlined"
        type="number"
        helperText={error}
        value={balance}
        onChange={(e) => {
          if (e.target.value === "" || parseFloat(e.target.value) >= 0) {
            setBalance(e.target.value);
            validateStack(e.target.value);
          } else {
            setBalance("0");
            validateStack("0");
          }
        }}
        sx={{
          borderRadius: 100,
          width: '100%',
          // fontSize: 'max(0.95vw, 20px)'
        }}
        inputProps={{style: {fontSize: 'max(0.95vw, 13px)'}}} 
        InputLabelProps={{style: {fontSize: 'max(0.95vw, 13px)'}}}
      />
      <Button 
      variant="contained"
      sx={{
        width: '100%',
        marginTop: 2,
      }}
      color='primary'
      disabled={disabled} onClick={() => onJoin(parseFloat(balance))} >Sit</Button>
      </Box>
  );
}

export interface PlayerEvent {
  player: string;
  type: GameEvent;
  digest: string;
  values: any;
  timestamp: number;
  eventSeq: number;
}


interface PublicCardsProps {
  cards: CardProps[]; // Replace 'any' with the actual type of your game state
}

interface CardProps {
  card: number;
  isPrivate: boolean;
  revealed: boolean;
  cardKey: string;
  folded: boolean;
  index?: number;
  current?: boolean;
}

interface PlayerProps {
  idx: number;
  player: string;
  cards: CardProps[];
  balance: number;
  playerBet: number;
  isSelf: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  exists: boolean;
  seat: number;
  displaySeat: number;
  isCurrentBetPlayer: boolean;
  isInHand: boolean;
  events: PlayerEvent[];
  formatAmount: (amount: number) => string;
  formatLink: (address: string, type: SuiType) => string | null;
}

interface PokerTableProps {
  joinGame: (amount: number, seat: number) => void;
  gameState: ParsedGameState;
  formatAmount: (amount: number) => string;
  players: PlayerProps[];
  displaySeatToSeat: Map<number, number>;
  publicCards: CardProps[];
  pot: number;
  canJoin: boolean;
  cannotJoinReason: string;
  walletConnected: boolean;
  haveBalance: boolean;
}

const Card: React.FC<CardProps> = ({ card, revealed, isPrivate, cardKey, folded, index, current }) => {
  const [suit, rank] = cardToReadable(card);
  const newRank = rank === CardRank.Ten ? "10" : rank;
  const reveal = revealed && (card !== null);
  const className = (reveal ? `card figures-${suit}` : `card hidden`) + (folded ? " folded" : "") + (index !== undefined ? ` idx-${index}` : "");
  const backClassName = 'card-back' + (index !== undefined ? ` idx-${index}` : "");
  const containerClassName = (reveal ? `card-container revealed` : `card-container`) + (index !== undefined ? ` idx-${index}` : "") + (current ? " current" : "");
  
  const getFigures = () => {
    if (isPrivate)  {
      return (
        <div className={className} key={cardKey}>
          <h1>{newRank}</h1>
          <div className={`figures top ${suit}`}></div>
          {/* <div className={`figures middle ${suit}`}></div> */}
          {/* <div className={`figures bottom ${suit}`}></div> */}
          <h1 className="h1-large">{newRank}</h1>
        </div>
      );
    } else {
      return (
        <div className={className} key={cardKey}>
          <h1>{newRank}</h1>
          <div className={`figures middle ${suit}`}></div>
          <h1>{newRank}</h1>
        </div>
      );
    }
  };
  return (
    <div className={containerClassName}>
    {/* <div className={className} key={cardKey}> */}
      {reveal ? getFigures() : 
      <div className={className} key={cardKey}></div>
      }
    {/* </div> */}
    <div className={backClassName}></div>
    </div>
  );
};

const PublicCards: React.FC<PublicCardsProps> = ({ cards }) => {
  const renderCards = () => {
    return  cards.filter((card) => card.revealed === true).map ((card) => (
        <Card card={card.card} revealed={card.revealed} isPrivate={false} cardKey={card.cardKey} key={card.cardKey} folded={false}></Card>
    ));
  };

  return <div className="table-circle">
    {renderCards()}
  </div>
};

const PlayerHand: React.FC<PlayerProps> = ({ idx, player, cards, balance, playerBet,
   isSelf, isDealer, isSmallBlind, isBigBlind, exists, seat, displaySeat,
    isCurrentBetPlayer, isInHand, events,
    formatAmount, formatLink
   }) => {

  const theme = useTheme();

  const addressLink = formatLink(player, SuiType.address);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const truncate = (str: string, n: number): string => {
    return (str.length > n) ? str.slice(0, n-1) + '...' : str;
  };

  const formattedBalance = formatAmount(balance);

  const decimalLength = formattedBalance.toString().split(".")[1]?.length || 0;

  const wrappedFormatAmount = (amount: number): string => {
    return parseFloat(formatAmount(amount)).toFixed(decimalLength + 1);
  };

  const getBalanceEl = () => {
    
    if (events.length > 0 && events.every((event) => event.type === GameEvent.PayoutEvent) ) {
      const wonAmount = events.reduce((acc, event) => acc + parseInt(event.values.amount), 0);
      const prevBalance = balance - wonAmount;
      return (
        <div className="player-balance">
          {/* <CountUp start={prevBalance} end={parseFloat(formatAmount(balance))} duration={4} formattingFn={formatAmount}/> */}
          <CountUp start={prevBalance} end={balance} duration={2} decimals={decimalLength}
           formattingFn={wrappedFormatAmount}
           />
        </div>
      );
    } else {
      return (
        <div className="player-balance">
          {formattedBalance}
        </div>
      );
    }
  }

  if (player === "") {
    return (
      <div className={"player player-" + (seat)} > </div>
    );
  }
  return (
    <div className={"player player-" + (displaySeat) + (isSelf ? " self" : "")} >

      { events ? <EventDisplay events={events} anchor={anchor} formatAmount={formatAmount} /> : <div></div>}
      { isDealer ? <div className="dealer-button"> B </div> : <div></div>}
      { isSmallBlind ? <div className="small-blind-button"> sb </div> : <div></div>}
      { isBigBlind ? <div className="big-blind-button"> bb </div> : <div></div>}

        {(playerBet > 0) ?
      <div className="player-mat">

      <div>
      <BetBody className="player-mat-value">
      {formatAmount(playerBet)}
      </BetBody>
       <div className="chip-10">
          <div className="chip v-10"></div>
          <div className="chip v-10"></div>
        </div>
        <div className="chip-5">
        <div className="chip v-5"></div>
          <div className="chip v-5"></div>
        </div>
          <div className="chip-1"></div>
       </div> 
       </div>
        : <div></div>
        }

      {/* <div className={"player-card-list" + (cards.length == 0 ? " empty": "" ) + (isCurrentBetPlayer ? " current" : "")}>
        {cards.map((card, index) => (
          <Card card={card.card} revealed={card.revealed} isPrivate={true} cardKey={card.cardKey} key={card.cardKey} folded={!isInHand} index={index} current={isCurrentBetPlayer}></Card>
        ))}
      </div> */}
      <div className={"player-info" +  (isCurrentBetPlayer ? " current" : "")}>


      <div className={"player-card-list" + (cards.length === 0 ? " empty": "" ) + (isCurrentBetPlayer ? " current" : "")}>
        {cards.map((card, index) => (
          <Card card={card.card} revealed={card.revealed} isPrivate={true} cardKey={card.cardKey} key={card.cardKey} folded={!isInHand} index={index} current={isCurrentBetPlayer}></Card>
        ))}
      </div>
      <div className={"player-info-container" + (isCurrentBetPlayer ? " current" : "")} style={{display: "flex", justifyContent: "flex-start", border: "1px solid grey"}}>
      <div className="player-identicon">
        <Jdenticon size={50} value={player} style={{}} darkMode={theme.palette.mode === 'dark'}/>
        </div>
        <div className={"player-text-info"}>
        <div className="player-name">          
          <Link href={addressLink ? addressLink : undefined} underline="none" rel="noopener noreferrer" target="_blank"
          sx={{
              color: 'blue',
            }}
          >
          {truncate(player, 10)}
          </Link>
        </div>
        {getBalanceEl()}
        </div>

        </div>
        <Anchor ref={setAnchor} aria-describedby="placement-popper" className="event-anchor" >
        </Anchor>
      </div>

    </div>
  );
};

const PokerTable: React.FC<PokerTableProps> = ({ joinGame, gameState, formatAmount, players, displaySeatToSeat
  , publicCards, pot, canJoin, cannotJoinReason, haveBalance, walletConnected }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [ selectedSeat, setSelectedSeat ] = React.useState<number | null >(null);
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(true);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  const onJoin = (balance: number) => {
    handleClose();
    joinGame(balance, selectedSeat!);
  }

  const selfExists = players.filter((player) => player.isSelf).length > 0;

  const filledSeats: number[] = players.map((player) => player.displaySeat);

  const getForSeat = (displaySeat: number) => {
    if (filledSeats.includes(displaySeat)) {
      const player = players.filter((player) => player.displaySeat === displaySeat)[0];
      const index = filledSeats.indexOf(displaySeat);
      return (
        <PlayerHand key={displaySeat} idx={index} player={player.player}
        cards={player.cards} balance={player.balance}
         playerBet={player.playerBet} isSelf={player.isSelf}
          isDealer={player.isDealer} isSmallBlind={player.isSmallBlind}
          isBigBlind={player.isBigBlind} exists={player.exists}
          seat={player.seat} displaySeat={player.displaySeat}
          isCurrentBetPlayer={player.isCurrentBetPlayer}
          isInHand={player.isInHand} events={player.events}
          formatAmount={player.formatAmount} formatLink={player.formatLink}
          />
      );
    } else {
      if (selfExists) {
        return (
          <div key={displaySeat} className={"player player-" + (displaySeat)} > </div>
        );
      }
      const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        handleClickOpen(event);
        setSelectedSeat(displaySeatToSeat.get(displaySeat)!);
      }

      // const myCannotJoinReason = (canJoin ? (haveBalance ? "Sit down" : (!walletConnected ? "Please connect wallet" : "Not enough SUI in wallet")) : "");
      const myCannotJoinReason = cannotJoinReason;

      return (
      <div key={displaySeat} className={"player player-" + (displaySeat)} >
        <div className="join-button">
        <Tooltip title={myCannotJoinReason}
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 10],
                },
              },
            ],
          },
        }}
        >
        <span>
        <Button
        aria-describedby={"asdf"}
        type="submit" color="primary" sx={ { borderRadius: 20 } }
        variant="contained" onClick={onClick}
        disabled={!canJoin}
        >Sit</Button>
        </span>
        </Tooltip>
        </div>
      </div>
      );
    }
  }

  const seatElements = USE_SEATS.map((seat) => getForSeat(seat));
  const totalPotStr = pot > 0 ? `Total pot: ${formatAmount(pot)}` : '';

  return (
    <div className="poker-table">
      <Popover
        id={"poker-popover"}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <JoinGameDialog open={open} gameState={gameState} formatAmount={formatAmount} onClose={handleClose} onJoin={onJoin} />
      </Popover>
          <PublicCards cards={publicCards} />
        <div className="game-divider"> </div>
        <div className="game-pot">
          <div className="pot-value">{totalPotStr}</div>
          {/* <div className="chip-10">
              <div className="chip v-10"
              style={{
                top: '10%',
              }}
              >
              </div>
              <div className="chip v-10"
              style={{
                top: '15%',
                right: '40%',
              }}
              >
              </div>
            </div>
            <div className="chip-5" >
              <div className="chip v-5"
              style={{
                top: '13%',
                right: '20%',
              }}
              ></div>
            </div>
              <div className="chip-1">
              <div className="chip v-1"
              style={{
                top: '10%',
                right: '40%',
              }}
              ></div>
              </div> */}
        </div>
        <div className="players">
          {seatElements}
        </div>
    </div>
  );
};

interface GameStateRendererProps {
  joinGame: (amount: number, seat: number) => void;
  gameState: ParsedGameState;
  privateState: PrivateState | null;
  centerSelf: boolean;
  canJoin: boolean;
  cannotJoinReason: string;
  currentBetPlayer: string | null;
  events: PlayerEvent[];
  formatLink: (key: string, type: SuiType) => string | null;
  formatAmount: (amount: number) => string;
  walletBalance: number | null;
  settings: Settings;
}

const GameStateRenderer: React.FC<GameStateRendererProps> = ({ joinGame, gameState, privateState, centerSelf,
   canJoin, cannotJoinReason, currentBetPlayer, events, formatLink, formatAmount, walletBalance, settings }) => {
  const getPlayerEvents = (player: string): PlayerEvent[] => {
    const playerEvents = events.filter((event) => event.player === player);
    return playerEvents;
  }

  const renderTable = () => {
    const selfPlayer = Object.keys(gameState.playerStates).find((player) => player === privateState?.player);
    const rotation = (selfPlayer && centerSelf) ? USE_SEATS.length - USE_SEATS.indexOf(gameState.playerStates[selfPlayer]?.seat) : 0;

    const rotateSeat = (seat: number): number => {
      if (!settings.centered) {
        return seat;
      }
      const orgIndex = USE_SEATS.indexOf(seat);
      const newIndex = (orgIndex + rotation) % USE_SEATS.length;
      return USE_SEATS[newIndex];
    }

    const players: PlayerProps[] = Object.entries(Object.entries(gameState.playerStates)).map(([index, [player, playerState]]) => (
      {
        idx: Number(index),
        player: player,
        cards: playerState.cards.map((card, idx) => (
          {
            card: card.card,
            revealed: card.revealed,
            isPrivate: true,
            cardKey: `${player}-${idx}`,
            folded: !playerState.isInHand,
          }
        )),
        balance: playerState.balance,
        playerBet: Number(playerState.bet),
        isSelf: (privateState !== null) && (player === privateState.player),
        isDealer: Number(index) === gameState.buttonIdx,
        isSmallBlind: Number(index) === gameState.smallBlindIdx,
        isBigBlind: Number(index) === gameState.bigBlindIdx,
        exists: true,
        seat: playerState.seat,
        displaySeat: (rotateSeat(playerState.seat) ),
        isCurrentBetPlayer: player === currentBetPlayer,
        isInHand: playerState.isInHand,
        events: getPlayerEvents(player),
        formatAmount: formatAmount,
        formatLink: formatLink,
    }));


    // map display to seat
    const displaySeatToSeat = USE_SEATS.reduce((acc, seat) => {
      acc.set(rotateSeat(seat), seat);
      return acc;
    }, new Map<number, number>());

    const publicCards: CardProps[] = gameState.publicState.map((card, idx) => (
      {
        card: card.card,
        revealed: card.revealed,
        isPrivate: false,
        cardKey: `public-${idx}`,
        folded: false,
      }
    ));
    return (
      // TODO: fix
      <PokerTable joinGame={joinGame} gameState={gameState} formatAmount={formatAmount}
      players={players} displaySeatToSeat={displaySeatToSeat}
      publicCards={publicCards} pot={gameState.pots[0]} canJoin={canJoin}
      cannotJoinReason={cannotJoinReason}
      walletConnected={walletBalance !== null}
      haveBalance={walletBalance !== null && walletBalance > 1000_000}
      />
    );
  }

  return (
      renderTable()
  );
};

export default GameStateRenderer;