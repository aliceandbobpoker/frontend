// src/GameInfo.tsx
import React, { useRef, useEffect, memo } from 'react';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { ListItemButton, useTheme } from '@mui/material';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Link } from "react-router-dom";
import Stack from "@mui/material/Stack";

import { Jdenticon } from './Jdenticon';
import { GameEvents } from './GamePage';

import {
      BetTypeInt, cardToReadable,  parseCardBits, CardSuit,
      GameEvent
  } from 'aliceandbob-client';

import {PlayerEvent} from './GameStateRenderer';
import { SuiType } from './SuiType';


var Hand = require('pokersolver').Hand;

interface GameHistoryProps {
  events: GameEvents;
  formatAmount: (amount: number) => string;
  formatLink: (address: string, type: SuiType) => string | null;
}

type FormattedEvent = {
  event: string;
  icon: string;
}

function Row(props: { isOpen: boolean, idx: string, events: PlayerEvent[],  formatAmount: (amount: number) => string, formatLink: (address: string, type: SuiType) => string | null }) {
  const theme = useTheme();
  const { isOpen, idx, events, formatAmount, formatLink } = props;
  const [open, setOpen] = React.useState(isOpen);

  const potValue = events.filter((event) => event.type === GameEvent.PayoutEvent).reduce((acc, event) => acc + parseInt(event.values.amount), 0);

  const eventsByDigest = events
  .filter((event) => event.timestamp)
  .sort((a, b) => a.timestamp - b.timestamp)
  .reduce((acc: {
    [digest: string]: PlayerEvent[];
  }, event) => {
    if (!event.digest) {
      return acc;
    }
    if (!acc[event.digest]) {
      acc[event.digest] = [];
    }
    acc[event.digest].push(event);
    return acc;
  }, {});
  const suitsMap = {
    [CardSuit.Hearts] : '♥',
    [CardSuit.Diamonds] : '♦',
    [CardSuit.Clubs] : '♣',
    [CardSuit.Spades] : '♠',
  };

  const cardToUnicode = (card: number) => {
    const readable = cardToReadable(card);
    const suitUnicode = suitsMap[readable[0]];
    const rank = readable[1];
    return rank + suitUnicode;
  }

  const roundToReadable = (round: number) => {
    if (round === 0) {
      return "Hole Cards";
    } else if (round === 1) {
      return "Flop";
    } else if (round === 2) {
      return "Turn";
    } else if (round === 3) {
      return "River";
    }
    return null;
  }

  const formatEvents = (eventSeq: PlayerEvent[]): FormattedEvent[] => {
    // if all events are Reveal, then group by round and player
    var allFormattedEvents: FormattedEvent[] = [];
    if (eventSeq.some((event) => event.type === GameEvent.RevealEvent)) {
      const revealEvents = eventSeq.filter((event) => event.type === GameEvent.RevealEvent);
      const eventSeqGrouped = revealEvents.reduce((acc: {
        [round: number]: {
          [player: string]: number[];
        }
      }, event) => {
        const round = event.values.round;
        const player = event.values.player;
        if (!acc[round]) {
          acc[round] = {};
        }
        if (!acc[round][player]) {
          acc[round][player] = [];
        }
        acc[round][player].push(event.values.revealed_card);
        return acc;
      }, {});
      allFormattedEvents = allFormattedEvents.concat(Object.keys(eventSeqGrouped).map((round) => {
        const roundInt = parseInt(round);
        const roundReadable = roundToReadable(roundInt);
        const players = Object.keys(eventSeqGrouped[roundInt]).map((player) => {
          const revealedCards = eventSeqGrouped[roundInt][player].map((card) => cardToUnicode(card));
          if (roundInt === 0) {
            return {
              event: " revealed " + revealedCards.join(", "),
              icon: player
            }
          } else {
            return {
              event: roundReadable + ": " + revealedCards.join(", "),
              icon: ""
            }
          }
        });
        return players;
      }).flat());
    }
    const nonRevealEvents = eventSeq.filter((event) => event.type !== GameEvent.RevealEvent); 
    allFormattedEvents = allFormattedEvents.concat(nonRevealEvents.map((event) => formatEvent(event)).flatMap((eventStr) => eventStr ? [eventStr] : []));
    return allFormattedEvents;
  }

  const formatEvent = (event: PlayerEvent) : FormattedEvent | null => {
    const eventStr = formatEventString(event);
    if (eventStr) {
      return {
        event: eventStr,
        icon: event.player
      };
    } else {
      return null;
    }
  }

  const formatEventString = (event: PlayerEvent): string | null => {
    const player = "";

    const eventType = event.type;
    if (eventType === GameEvent.AddBetEvent) {
      const betType = event.values.bet_type;
      if (betType === BetTypeInt.CALL) {
        return player + " called " + formatAmount(event.values.amount);
      } else if (betType === BetTypeInt.BLIND_BET) {
        return player + " posted blind (" + formatAmount(event.values.amount) + ")";
      } else {
        if (event.values.is_raise) {
          return player + " raised to " + formatAmount(event.values.total_amount);
        } else {
          return player + " bet " + formatAmount(event.values.amount);
        }
      }
    }
    else if (eventType === GameEvent.AddPlayerEvent) {
        return player + " joined the game";
    }
    else if (eventType === GameEvent.RemovePlayerEvent) {
        return player + " left the game";
    }
    else if (eventType === GameEvent.RevealEvent) {
      const revealedCard = event.values.revealed_card;
      const unicodeCard = cardToUnicode(revealedCard);
      const round = event.values.round;
      if (round === 0) {
        const player = event.values.player;
        return player + " " + unicodeCard;
      } else {
        return unicodeCard + " dealt on " + roundToReadable(round);
      }
    }
    else if (eventType === GameEvent.PayoutEvent) {
      const handBits = parseInt(event.values.hand_bits);
      if (handBits > 0) {
        const parsedHand = parseCardBits(handBits).cards.map((card) => cardToReadable(card)).map((card) => card[1] + card[0].toLowerCase());
        const hand = Hand.solve(parsedHand);
        return player + " won " + formatAmount(event.values.amount) + " SUI (" + hand.descr + ")";
      };
      return player + " won " + formatAmount(event.values.amount) + " SUI";
    }
    else if (eventType === GameEvent.AddCheckEvent) {
      return player + " checked";
    }
    else if (eventType === GameEvent.AddFoldEvent) {
      return player + " folded";
    } else if (eventType === GameEvent.ShuffleEvent) {
      return "Shuffled the deck";
    }
    else {
      return null;
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  
  if (!events) {
      return null;
  }


  const getListItemText = (events: PlayerEvent[]) => {
    const formattedEvents = formatEvents(events);
    if (formattedEvents.length === 0) {
      return null;``
    }

    // make bold if new hand or reveal event
    const isBold = events.some((event) => {
      return event.type === GameEvent.NewHandEvent || event.type === GameEvent.RevealEvent;
    });
    return (
      <ListItemText 
      key={`${events[0].digest}-list-item-text`}
      primaryTypographyProps={{fontSize: '200%'}}
      secondaryTypographyProps={{
        fontSize: 'max(0.7vw, 8px)'
    }}
      primary={
        <Typography component="div"
        // variant="h6"
        >
          <Stack direction="column">
            {formattedEvents.map((formattedEvent) => {
              return (
                <Box component="span" fontWeight={isBold ? "bold" : "normal"} 
                sx={{display: "flex", justifyContent: "flex-start"}}
                key={`${events[0].digest}-${formattedEvent.event}`}
                >
                  {formattedEvent.icon &&
                  <Jdenticon size={20} value={formattedEvent.icon} style={{
                    border: `0.5px solid ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}`
                  }} darkMode={theme.palette.mode === 'dark'} />}
                  <Typography
                  sx=
                  {{display: "flex",
                  justifyContent: "flex-start",
                  fontWeight: isBold ? "bold" : "regular",
                  marginLeft: 0.5,
                  fontSize: 'max(0.85vw, 11px)'
                  }}
                  >
                  {formattedEvent.event}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
          </Typography>
      }
      secondary={formatTimestamp(events[0].timestamp)}
      style={{fontWeight: isBold ? "bold" : "normal",
      marginTop: '0px',
      marginBottom: '0px',
    }}
      />
    );
  }

  const getListItemButton = (digest: string, linkStr: string | null, listItemText: JSX.Element ): JSX.Element => {
    if (linkStr === null) {
      return (
        <React.Fragment key={digest}>
          <ListItem disablePadding>
            <ListItemButton>
              {listItemText}
            </ListItemButton>
          </ListItem>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment key={digest}>
      <ListItem disablePadding>
        <ListItemButton  component={Link} rel="noopener noreferrer" to={linkStr} target="_blank"
        sx={{
          padding: '2%',
          borderRadius: '15px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(200,200,200,0.5)' : 'rgba(0, 0, 0, 0.5)'}`,
          marginTop: '2px',
        }}
        >
          {listItemText}
        </ListItemButton>
      </ListItem>
      </React.Fragment>
      );
    }
  }

  return (
    <React.Fragment>
      <TableRow sx={{ 
        '& > *': { borderBottom: 'unset' },
        height: '10%',
     }}>
        <TableCell
        sx={{
          // width: '10px',
          fontSize: '4px',
          padding: '0px',
          textAlign: 'center'
        }}
        >
          <IconButton
            aria-label="expand row"
            size="medium"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row"
        sx={{
          // height: '10px',
          fontSize: 'max(0.95vw, 13px)',
        }}
        >
          {idx}
        </TableCell>
        <TableCell
        sx={{
          fontSize: 'max(0.95vw, 13px)',
        }}
        >{ (potValue !== 0 ? `${formatAmount(potValue)} SUI`: '') }</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, padding: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
                     {Object.keys(eventsByDigest).map((digest) => {
        const events = eventsByDigest[digest];
        const listItemsText = getListItemText(events);
        const linkStr = formatLink(digest, SuiType.txblock);
        if (listItemsText) {
          return getListItemButton(digest, linkStr, listItemsText);
          } else {
            return null;
          }
        }
        ).filter((listItem) => listItem !== null)
        }
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

const propsAreEqual = (prevProps: GameHistoryProps, nextProps: GameHistoryProps) => {
  return prevProps.events.events.length === nextProps.events.events.length;
}


const GameHistory: React.FC<GameHistoryProps> = memo(({
    events,
    formatAmount,
    formatLink
}) => {
  const scrollRef = useRef<null | HTMLDivElement>(null); 
  useEffect(() => {
    if (scrollRef.current) {
      if (events.snapshot) {
        scrollRef.current.scrollIntoView({ behavior: "auto" });
      } else {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [events.events.length, events.snapshot]);

  if (!events) {
      return null;
  }
  const groupedByIndex: {[index: string]: PlayerEvent[]} = {};
  //iterate over events
  let currentHandIdx = -1;
  for (const event of events.events) {
    const eventType = event.type;
    if (eventType === GameEvent.NewHandEvent) {
      const handIdx = event.values.hand_idx;
      currentHandIdx = handIdx;
      groupedByIndex[currentHandIdx] = [event];
    } else if (currentHandIdx !== -1) {
      groupedByIndex[currentHandIdx].push(event);
    }
  }

  const lastHandIdx = Math.max(...Object.keys(groupedByIndex).map((handIdx) => parseInt(handIdx))).toString();


  return (
    <Box
      sx={{
          width: "95%",
          height: '100%',
          mb: 2,
          overflow: "hidden",
          // overflowY: "scroll",
          zIndex: (theme) => theme.zIndex.drawer + 3,
          '& .MuiTableContainer-root': {
            'box-shadow': 'none'
          },
          '& .MuiTable-root': {
            // 'border-collapse': 'separate',
            'border-spacing': '40 10px',
            'border': 'transparent'
          },
          '& .MuiTable-root th, .MuiTable-root td': {
            // 'border': '10px solid white',
          }
        }}
    >
    <Paper
    key = "game-history-paper"
     sx={{ width: '100%',
     height: '100%', 
     overflow: 'auto'
    }} elevation={0}
    variant="outlined" 
  >
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{width: '5px',

            padding: '0px'}}
             />
            <TableCell sx={{
              width: '4px',
              fontSize: 'max(1vw, 12px)',
            }}>
              Hand</TableCell>
            <TableCell
            sx={{
              width: '4px',
              fontSize: 'max(1vw, 12px)',
            }}
            > Pot </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(groupedByIndex).map((handIdx) => (
            <Row isOpen={handIdx === lastHandIdx}
            idx={handIdx} key={handIdx} events={groupedByIndex[handIdx]} formatAmount={formatAmount} formatLink={formatLink} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <div ref={scrollRef} />
    </Paper>
     </Box>
  );
}, propsAreEqual);

export default GameHistory;