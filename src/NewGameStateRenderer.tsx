// src/NewGameStateRenderer.tsx
import React, { useEffect } from 'react';
// import './App.css';
import {
  ReactFlow,
  useReactFlow,
  getNodesBounds,
  Rect
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PrivateState, GameEvent, ParsedGameState } from 'aliceandbob-client';

import { SuiType } from './SuiType';
import { Settings } from './Settings';
import { PlayerNode, PublicCards } from './PlayerNode';
const USE_SEATS = [0,1,2,3,4,5,6,7];

export type JoinGameParams = {
  balance: number,
  seat: number,
}

export interface PlayerEvent {
  player: string;
  type: GameEvent;
  digest: string;
  values: any;
  timestamp: number;
  eventSeq: number;
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

export interface PlayerProps {
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

interface ZoomInfoProps {
  bounds: Rect;
}

const ZoomInfo: React.FC<ZoomInfoProps> = ({ bounds }) => {
  const reactFlow = useReactFlow();
  useEffect(() => {
    const newBounds = {
      x: bounds.x + 10,
      y: bounds.y - 17,
      width: bounds.width + 50,
      height: bounds.height + 80,
    };
    const handleResize = () => {
      reactFlow.fitBounds(newBounds, { duration: 200 });
    }
    setTimeout(() => handleResize(), 1000);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bounds, reactFlow]);

  return (
    <div className="zoom-info">
    </div>
  );
}

const nodeTypes = { playerNode: PlayerNode, publicCards: PublicCards };

const PokerTable: React.FC<PokerTableProps> = ({ joinGame, gameState, formatAmount, players, displaySeatToSeat
  , publicCards, pot, canJoin, cannotJoinReason, haveBalance, walletConnected }) => {
  
  const X_SPACE = 135;
  const Y_SPACE = 120;

  const initialNodes: any = [
    { id: '0', type: 'playerNode', position: { x: 4 * X_SPACE, y: 4 * Y_SPACE }, data: { label: '0', seat: 0 }},
    { id: '1', type: 'playerNode', position: { x: 3 * X_SPACE, y: 4 * Y_SPACE }, data: { label: '1', seat: 1 }},
    { id: '2', type: 'playerNode', position: { x: 2 * X_SPACE, y: 3 * Y_SPACE }, data: { label: '2', seat: 2 }},
    { id: '3', type: 'playerNode', position: { x: 3 * X_SPACE, y: 2 * Y_SPACE }, data: { label: '3', seat: 3 }},
    { id: '4', type: 'playerNode', position: { x: 4 * X_SPACE, y: 2 * Y_SPACE }, data: { label: '4', seat: 4 }},
    { id: '5', type: 'playerNode', position: { x: 5 * X_SPACE, y: 2 * Y_SPACE }, data: { label: '5', seat: 5 }},
    { id: '6', type: 'playerNode', position: { x: 6 * X_SPACE, y: 3 * Y_SPACE }, data: { label: '6', seat: 6 }},
    { id: '7', type: 'playerNode', position: { x: 5 * X_SPACE, y: 4 * Y_SPACE }, data: { label: '7', seat: 7 }},
    { id: 'publicCards', type: 'publicCards', position: { x: 3 * X_SPACE, y: 3 * Y_SPACE }, data: {
      cards: publicCards,
      pot: pot,
      formatAmount: formatAmount,
    }},
  ];



  for (const node of initialNodes) {
    if (node.type === 'playerNode') {
      node.data.cannotJoinReason = cannotJoinReason;
      node.data.canJoin = canJoin;
      node.data.gameState = gameState;
      node.data.formatAmount = formatAmount;
      node.data.joinGame = joinGame;
      node.data.selfExists = players.filter((player) => player.isSelf).length > 0;
      node.data.actualSeat = displaySeatToSeat.get(node.data.seat)!;
    }
  }

  for (const player of players) {
    initialNodes[player.displaySeat].data.playerData = player;
  }

  const initialEdges = [
    { id: 'e0-1', source: '0', target: '1', selectable: false},
    { id: 'e1-2', source: '1', target: '2', selectable: false },
    { id: 'e2-3', source: '2', target: '3', selectable: false },
    { id: 'e3-4', source: '3', target: '4', selectable: false },
    { id: 'e4-5', source: '4', target: '5', selectable: false },
    { id: 'e5-6', source: '5', target: '6', selectable: false },
    { id: 'e6-7', source: '6', target: '7', selectable: false },
    { id: 'e7-0', source: '7', target: '0', selectable: false },
  ];

  const bounds = getNodesBounds(initialNodes);
  const disabled = true;

  return (

    <div style={{ width: '100%', height: '100%', top: '0%', left: '-10%' }}>
    <ReactFlow
      nodes={initialNodes}
      edges={initialEdges}
      // @ts-ignore
      nodeTypes={nodeTypes}
      edgesFocusable={!disabled}
      nodesDraggable={!disabled}
      nodesConnectable={!disabled}
      nodesFocusable={!disabled}
      draggable={!disabled}
      panOnDrag={!disabled}
      zoomOnScroll={!disabled}
      elementsSelectable={!disabled}
      
      // Optional if you also want to lock zooming
      zoomOnDoubleClick={!disabled}
      proOptions={{ hideAttribution: true }}
    >
      <ZoomInfo bounds={bounds} />
    </ReactFlow>
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
  const numPlayers = Object.keys(gameState.playerStates).length;

  const renderTable = () => {
    const selfPlayer = Object.keys(gameState.playerStates).find((player) => player === privateState?.player);
    const rotation = (selfPlayer && centerSelf) ? USE_SEATS.length - USE_SEATS.indexOf(gameState.playerStates[selfPlayer]?.seat) : 0;
    // const rotation = 7;

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
        isDealer: (Number(index) === gameState.buttonIdx) && (numPlayers > 1),
        isSmallBlind: (Number(index) === gameState.smallBlindIdx) && (numPlayers > 1),
        isBigBlind: (Number(index) === gameState.bigBlindIdx) && (numPlayers > 1),
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