// src/GameInfo.tsx
import React from 'react';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import CardContent from '@mui/material/CardContent';

import {
    ParsedGameState,
  } from 'aliceandbob-client';
import { SuiType } from './SuiType';

interface GameInfoProps {
  gameState: ParsedGameState;
  formatAmount : (amount: number) => string;
  formatLink: (address: string, type: SuiType) => string | null;
}

const GameInfo: React.FC<GameInfoProps> = ({
    gameState,
    formatAmount,
    formatLink
}) => {
    if (!gameState) {
        return null;
    }
    const blindStr = formatAmount(gameState.smallBlind) + "/" + formatAmount(gameState.bigBlind) + " SUI";
    
    const truncate = (str: string, n: number): string => {
      return (str.length > n) ? str.slice(0, n-1) + '...' : str;
    };
  
    const getPlayerSeatInfo = (playerId: string) => {
      const addressLink = formatLink(playerId, SuiType.address);
        const playerState = gameState.playerStates[playerId];
        return (
          <ListItem key={playerId} disablePadding>
        <Typography
          className={playerId}
          noWrap
          color="textPrimary"
          // variant="body1"
          sx={{ fontSize: 'max(1vw, 10px)' }}
        >
          {`Seat ${playerState.seat + 1}: `}
          <Link href={addressLink ? addressLink : undefined} underline="none" rel="noopener noreferrer" target="_blank"> 
            {truncate(playerId, 10)}
          </Link>
          ({formatAmount(playerState.balance)} SUI)
        </Typography>
        </ListItem>
        );
    };



  return (
    <Box
    sx = {{
      mt: 10,
      mb: 1,
      height: '20%',
      width: "95%",
    }}
    
  display="flex"
  justifyContent="left"
  alignItems="left"
    >
    <Card sx={{
      overflow: 'auto' ,
      minWidth: '100%',
     '&.MuiTypography-root': {
        fontSize: '11.5rem',
    }
  }}  variant="outlined">
        <CardContent>
            <Typography
            align="left" gutterBottom
            sx= {{
              fontSize: 'max(1.15vw, 12px)',
            }}
            >
            No Limit Hold'em
            </Typography>
            <Typography
            // variant="h6" 
            align="left" gutterBottom
            sx= {{
              fontSize: 'max(1.15vw, 10px)',
              fontWeight: 'bold',
            }}
          
            >
              {blindStr}
            </Typography>
            <Typography sx={{
            fontSize: 'max(1.3vw, 10px)',
             }} align="left" >
            
            </Typography>
            <List style={{maxHeight: '100%', overflow: 'auto'}} 
            >
            {
                Object.keys(gameState.playerStates).map(
                    (playerId) => getPlayerSeatInfo(playerId)
                )
            }
            </List>
        </CardContent>

        </Card>
        
    </Box>
  );
};

export default GameInfo;