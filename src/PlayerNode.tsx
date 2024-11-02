import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { PlayerEvent, PlayerProps } from './NewGameStateRenderer';

import { CardRank, BetTypeInt, cardToReadable, GameEvent, ParsedGameState } from 'aliceandbob-client';

import { styled } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material';

import { SuiType } from './SuiType';
import { Jdenticon } from './Jdenticon';

const handleStyle = { 
    opacity: 0
};


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

interface JoinGameDialogProps {
  open: boolean;
  gameState: ParsedGameState;
  formatAmount: (amount: number) => string;
  onClose: () => void;
  onJoin: (balance: number) => void;
}
  

export function JoinGameDialog(props: JoinGameDialogProps) {
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

const BetBody = styled('div')(
    ({ theme }) => `
    // left: 15%;
    top: 0%;
    width: 120px;
    padding: 2px 2px;
    margin: 5px;
    border-radius: 10px;
    opacity: 0.6;
    font-family: 'Lucida Grande';
    font-size: 12px;
    z-index: 3;
    text-align: center;
    vertical-align: middle;
    // line-height: 90px;  
  `,
  );




interface PlayerNodeProps {
    data: {
        label: string;
        seat: number;
        actualSeat: number;
        playerData: PlayerProps;
        cannotJoinReason: string;
        canJoin: boolean;
        gameState: ParsedGameState;
        joinGame: (balance: number, seat: number) => void;
        formatAmount: (amount: number) => string;
        selfExists: boolean;
    };
    id: string;
    type: string;
    position: { x: number; y: number };
}

interface PublicCardsProps {
    data: {
        cards: CardProps[];
        pot: number;
        formatAmount: (amount: number) => string;
    };
    id: string;
    type: string;
    position: { x: number; y: number };
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

const Card: React.FC<CardProps> = ({ card, revealed, isPrivate, cardKey, folded, index, current }) => {
  const theme = useTheme();
  const [suit, rank] = cardToReadable(card);
  const newRank = rank === CardRank.Ten ? "10" : rank;
  const reveal = revealed && (card !== null);
  const className = (reveal ? `card v2 figures-${suit}` : `card hidden`) + (folded ? " folded" : "") + (index !== undefined ? ` idx-${index}` : "") + (isPrivate ? "" : " public") + (theme.palette.mode === 'light' ? ' light' : ' dark');
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
          {/* <h1 className="h1-large">{newRank}</h1> */}
        </div>
      );
    } else {
      return (
        <div className={className} key={cardKey}>
          <h1>{newRank}</h1>
          <div className={`figures middle ${suit}`}></div>
          {/* <h1>{newRank}</h1> */}
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

export const PlayerNode: React.FC<PlayerNodeProps> = ({ data, id, type, position }) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const handleClose = () => {
      setOpen(false);
      setAnchorEl(null);
    };

    const handleClickOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(true);
      setAnchorEl(event.currentTarget);
    };

    const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      handleClickOpen(event);
    }

    const onJoin = (balance: number) => {
      handleClose();
      data.joinGame(balance, data.seat);
    }
    // use 1/1 if not player 3,4,5
    // const aspectRatio = data.seat === 3 || data.seat === 4 || data.seat === 5 ? '1 / 1.5' : '1 / 1';
    const aspectRatio = '1 / 1';

    const seat = data.seat;
    let sourcePosition;
    let targetPosition;

    // for seats 0, 1, and 7 the source position is on the left and the target position is on the right
    // for seats 3, 4, and 5 the source position is on the right and the target position is on the left
    // for seat 2 the source position is on the top and the target position is on the bottom
    // for seat 6 the source position is on the bottom and the target position is on the top
    if (seat === 0 || seat === 1 || seat === 7) {
        sourcePosition = Position.Left;
        targetPosition = Position.Right;
    } else if (seat === 3 || seat === 4 || seat === 5) {
        sourcePosition = Position.Right;
        targetPosition = Position.Left;
    } else if (seat === 2) {
        sourcePosition = Position.Top;
        targetPosition = Position.Bottom;
    } else if (seat === 6) {
        sourcePosition = Position.Bottom;
        targetPosition = Position.Top;
    } else {
        throw new Error(`Invalid seat number: ${seat}`);
    }


    const seatInfoElement = data.label ? <div 
    style={{ fontSize: 9,
    fontFamily: 'Lucida Grande',
    position: 'relative', left: '0px', top: '1px',
    color: theme.palette.mode === 'light' ? grey[800] : grey[50],
    // backgroundColor: 'white',
    // borderRadius: '5px',
    // outlineColor: 'black',
    // width: '10px'
    // position: 'absolute', left: '50%', top: '5%', transform: 'translate(-50%, -50%)'
  }}
    >{`${data.actualSeat + 1}`}</div> : null;

    const playerData = data.playerData;
    const sizeLength = 60;

    const noDataBackground = theme.palette.mode === 'light' ? '#e2e2e2' : '#343434';
    if (!playerData) {
      if (!data.selfExists && (data.canJoin || data.cannotJoinReason )) {
        return (
          <div
          style={{
            pointerEvents: 'all',
            // maxWidth: sizeLength , maxHeight: sizeLength, minWidth: sizeLength, minHeight: sizeLength,
            background: noDataBackground, padding: 0, borderRadius: '100%', aspectRatio: '1 / 1', top: '5px',
            height: 50, zIndex: 1, position: 'relative'
          }} >
              <Handle
                  type="source"
                  position={sourcePosition}
                  id="a"
                  style={handleStyle}
                  onConnect={(params) => {}}
                  isConnectable={false}
              />
            <Handle
                  type="target"
                  position={targetPosition}
                  id="b"
                  style={handleStyle}
                  onConnect={(params) => {}}
                  isConnectable={false}
              />
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
                    <JoinGameDialog open={open} gameState={data.gameState} formatAmount={data.formatAmount} onClose={handleClose} onJoin={onJoin} />
                  </Popover>
            <div className="join-button">
            {seatInfoElement}
            <Tooltip title={data.cannotJoinReason}
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
            type="submit" color="primary" sx={ { borderRadius: 10 } }
            variant="outlined" onClick={onClick}
            disabled={!data.canJoin}
            style={{maxWidth: '20px',
            maxHeight: '20px',
            minWidth: '20px',
            minHeight: '20px',
            top: '-2px',
             fontSize: 10}}
            >Sit</Button>
            </span>
            </Tooltip>
            </div>
          </div>
        );
      } else {
        return (
          <div style={{ background: noDataBackground,
          padding: 0, borderRadius: '100%', aspectRatio: '1 / 1', top: 5,
          height: 50, zIndex: 1, position: 'relative'
       }}>
        {seatInfoElement}
              <Handle
                  type="source"
                  position={sourcePosition}
                  id="a"
                  style={handleStyle}
                  onConnect={(params) => {}}
                  isConnectable={false}
              />
            <Handle
                  type="target"
                  position={targetPosition}
                  id="b"
                  style={handleStyle}
                  onConnect={(params) => {}}
                  isConnectable={false}
              />
          </div>
        );
      }
    }

    const isBigBlind = playerData.isBigBlind;
    const isSmallBlind = playerData.isSmallBlind;
    const isDealer = playerData.isDealer;
    const balance = playerData.balance;
    const formattedBalance = playerData.formatAmount(balance);
    const backgroundColor = 'white';
    const isCurrentBetPlayer = playerData.isCurrentBetPlayer;
    const playerBet = playerData.playerBet;
    const formatAmount = playerData.formatAmount;

    const events = data.playerData.events || [];
    const eventsArePayoutEvents = (events.length > 0) && events.some((event) => event.type === GameEvent.PayoutEvent);
    
    const formatEvents = (events: PlayerEvent[]) : string | null =>  {
      if (events.length === 0) {
        return null;
      }
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
          const filteredEvents = events.filter((event) => event.type === GameEvent.PayoutEvent);
          const total = filteredEvents.reduce((acc, event) => acc + parseInt(event.values.amount), 0);
          return `won ${formatAmount(total)}`;
        }
      }
      return null;
    };

    
    const getCards = (playerData: PlayerProps) => {
        if (!playerData) {
            return <div></div>;
        } 
        const cards = playerData.cards;
        return (
            <div className={"player-card-list v2" + (cards.length === 0 ? " empty": "" ) + (isCurrentBetPlayer ? " current" : "")}>
        {cards.map((card, index) => (
            <Card card={card.card} revealed={card.revealed} isPrivate={true} cardKey={card.cardKey} key={card.cardKey} folded={!playerData.isInHand} index={index} current={isCurrentBetPlayer}></Card>
          ))}
        </div>);
    }



    const buttonSuffix = seat === 2 ? ' bottom-right' : (seat === 6 ? ' bottom-left' : '');
    const outlineColor = data.playerData.isSelf ? '#42bcc5' : '#f08080' ;
    const formattedEvents = (events.length > 0) ? formatEvents(events) : null;
    const eventDisplay = formattedEvents ? <div
    style={{
      position: 'relative',
      // hack
      left: (formattedEvents === 'fold') ? '0px' : '-33px',
      top: '-74px',
      padding: '0.3px',
      // height: '20px',
      outlineColor: 'black',
      outlineStyle: 'solid',
      outlineWidth: '0.3px',
      // borderTopLeftRadius: '5px',
      // borderTopRightRadius: '5px',
      borderRadius: '3px',
      paddingLeft: '3px',
      paddingRight: '3px',
      paddingTop: '0px',
      backgroundColor: (theme.palette.mode === 'light') ? 'white' : 'black',
      color: (theme.palette.mode === 'light') ? grey[800] : grey[50],
      fontSize: 9,
      // opacity: 0.99,
      // marginTop: '13px',
      zIndex: -2,
      width: 'max-content',
      margin: 'auto',
      // fontFamily: 'Lucida Grande',
      boxShadow: `0px 0px 5px 0px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.75)' : 'rgba(240,240,240,0.75)'}`,
    }}
    >{formattedEvents}</div> : null;
    const addressLink = playerData.formatLink(playerData.player, SuiType.address);


    return (
        <div style={{
        aspectRatio: aspectRatio,
        width: sizeLength, height: sizeLength
         }}>
            {getCards(playerData)}
            <a href={addressLink!} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }} className='player-link'>
        <div style={{ background: backgroundColor, padding: 0, borderRadius: '100%',
        // aspectRatio: '1 / 1',
         top: '0%',
        width: sizeLength,
            height: sizeLength, outlineColor: outlineColor, outlineStyle: 'solid', outlineWidth: '2.5px', zIndex: 0, position: 'relative',
            transformStyle: "preserve-3d", textAlign: 'center',
            ...(isCurrentBetPlayer ? { animation: `${data.playerData.isSelf ? 'SELF' : ''}FLASHINGV2 1.5s infinite` } : {}),
            backgroundColor: (theme.palette.mode === 'light') ? '#EEEEEE' : '#303740',
            textDecoration: 'none',
         }}>
        <Tooltip title={data.playerData.player}>
        <Jdenticon size={50} value={data.playerData.player}
        darkMode={theme.palette.mode === 'dark'}
        style={{
            opacity: 0.8,
            position: 'absolute',
            outlineStyle: 'none',
            pointerEvents: 'all',
            cursor: 'pointer',
            backgroundColor: (theme.palette.mode === 'light') ? 'white' : '#303740',
            zIndex: 0,
            left: 0,
            border: '0px',
          }}
        />
        </Tooltip>
        <div style= {{
          zIndex: 0,
        }}>
      { (isSmallBlind && !isDealer) && <div className={`small-blind-button v2${buttonSuffix}`}> sb </div>}
      { (isBigBlind && !isDealer) && <div className={`big-blind-button v2${buttonSuffix}`}> bb </div> }
      { isDealer && <div className={`dealer-button v2${buttonSuffix}`}> D </div> }
          {seatInfoElement}
                    {(playerBet > 0) ?
      <div className={`player-mat v2 p${seat}`}>
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
            <Handle
                type="source"
                position={sourcePosition}
                id="a"
                style={handleStyle}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={false}
            />
            <div
            style= {{
              position: 'relative',
              top: `${6.7 + ((formattedBalance.length < 7) ? 0 : formattedBalance.length/6)}px`,
              borderRadius: '5px',
              paddingLeft: '3px',
              paddingRight: '3px',
              paddingTop: '0px',
              backgroundColor: (theme.palette.mode === 'light') ? '#EEEEEE' : '#303740',
              // fontSize is based on length of formattedBalance
              fontSize: (formattedBalance.length < 6) ? 13 : Math.max(19 - formattedBalance.length, 6),
              opacity: 0.93,
              width: 'max-content',
              margin: 'auto',
              fontFamily: 'Lucida Grande',
            }}
            >{formattedBalance}</div>

            <Handle
                type="target"
                position={targetPosition}
                id="b"
                style={handleStyle}
                onConnect={(params) => {}}
                isConnectable={false}
            />
            </div>
        </div>
        </a>
        {
              eventDisplay
            }
        </div>
    );
}



export const PublicCards: React.FC<PublicCardsProps> = ({ data, id, type, position }) => {
    const cards = data.cards;
    const revealedCards = cards.filter((card) => card.revealed === true);
    const renderCards = () => {
      return revealedCards.map ((card) => (
          <Card card={card.card} revealed={card.revealed} isPrivate={false} cardKey={card.cardKey} key={card.cardKey} folded={false}></Card>
      ));
    };

    const potString = `Pot: ${data.formatAmount(data.pot)}`;

    if (revealedCards.length === 0) {
      return <div></div>;
    }
  
    return <div className="table-circle v2" style={{ height: 60 ,
    width: 219,
    top: -4,
    left: -10,
    position: 'relative',
    borderRadius: '8px',
    // boxShadow: '0px 0px 0px 1px rgba(0,128,0,0.25)'
    }}>
      {renderCards()}
      <div className="pot v2"
      style={{
          fontSize: 15,
          borderRadius: 10,
          // outlineColor: 'black',
          // outlineStyle: 'solid',
          fontFamily: 'Lucida Grande',
          top: '10px',
          left: '235px',
          position: 'absolute',
          width: 'max-content',
      }}>
        {(data.pot > 0) && <div className="pot-value">{potString}</div>}
        </div>
    </div>;
};
