import React from 'react';
import {useLocalStorage} from 'react-use';
import Box from '@mui/material/Box';
import './App.css';
import { SuiClient } from '@mysten/sui.js/client';
import { useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit';
import { createNetworkConfig, useCurrentAccount,
  useSuiClientContext
 } from '@mysten/dapp-kit';

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useEffect } from 'react';
import  { readExisting } from "fastfile";
import GamePage, {getZkey} from './GamePage';
import {darkTheme, lightTheme} from './index';

import { ADMIN_ADDRESS, NETWORK_CONFIG } from './Constants';
import { StartGameParams } from './GameControls'
import Lobby from './Lobby';
import ButtonAppBar, { BalanceTransitionProps } from './TopBar';
import { initDB } from './db';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from "@mui/material/styles";
import { styled } from '@mui/system';

import { useSnackbar } from 'notistack';

import CssBaseline from '@mui/material/CssBaseline';

// Then somewhere in a render method:


import {
  startNewGame,
  privateToPublic, getAllGames,
  getRandomScalar,
  GameObject,
  isGameObject
} from 'aliceandbob-client';

import { Scalar, buildBn128,  } from "ffjavascript";
import { Settings } from './Settings';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
const js_crypto = require("@iden3/js-crypto");

// @ts-ignore
const { useNetworkVariable } = createNetworkConfig(NETWORK_CONFIG);

buildBn128().then((data: any) => {
  // @ts-ignore
  window.curve = data;
});

  // @ts-ignore
window.readExisting = readExisting;
  // @ts-ignore
window.bitLength = Scalar.bitLength;


function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
      <Box sx={{ width: '80%' }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
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

const PopupBody = styled('div')(
  ({ theme }) => `
  width: 50%;
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
`,
);

interface AppProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}


const formatAmount = (amount: number) => {
  return (amount / (10 ** 9)).toFixed(2).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1');
};

function App({settings, setSettings}: AppProps) {
  const balanceRef = React.useRef<BalanceTransitionProps | null > (null);

  const currentAccount = useCurrentAccount();
  const [dark, setDark] = useLocalStorage<boolean>('dark_theme', false);

	const packageId = useNetworkVariable('myMovePackageId');
  const formatLink = useNetworkVariable('formatLink');
  const ctx = useSuiClientContext();

	const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
  const [localPrivateKey, setLocalPrivateKey] = useLocalStorage<string | null>('saloon_card_private_key', null);
  const client = useSuiClient();
  const navigate = useNavigate();
  const loadingBalanceRef = React.useRef(false);
  const [balance, setBalance] = React.useState<BalanceTransitionProps | null > (null);
  const [loadingResources, setLoadingResources] = React.useState(false);
  const [resourceProgress, setResourceProgress] = React.useState(0);
  const { enqueueSnackbar } = useSnackbar();


  const toggleTheme = () => {
    setDark(!dark);
  };

  useEffect(() => {
    // init private key
    if (localPrivateKey == null || localPrivateKey === '') {
      const ppk = getRandomScalar(js_crypto.babyJub.subOrder);
      const newPrivateKey = '' + ppk;
      setLocalPrivateKey(newPrivateKey);
      console.log('new priv key: ' + localPrivateKey);
    }
    else {
      console.log('found priv key: ' + localPrivateKey);
    }

    // init resources
    const initResources = async () => {
      setLoadingResources(true);
      const dbInitialized = await initDB();
      // rough total is 120MB;
      var roughTotal = 120 * 1024 * 1024;
      if (dbInitialized) {
        var totalSoFar = 0;
        const keysToFetch = ['zero_encrypt_0001', 'encrypt_shuffle_0001'];
        for (const key of keysToFetch) {
          const totalSoFarConst = totalSoFar;
          const zkey = await getZkey(key, (progress) => {
            setResourceProgress((progress.transferred + totalSoFarConst) / roughTotal * 100);
          });
          totalSoFar += zkey.data.length;
        }
      }
      setResourceProgress(100);
      // let progress bar show for a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoadingResources(false);
    };
    initResources();
  }, []);

  const fetchBalance = async () => {
    if (currentAccount?.address) {
      const coinBalance = await client.getBalance({owner: currentAccount.address});
      const newBalance = parseInt(coinBalance.totalBalance);

      if (balanceRef.current !== null) {
        const previousBalance = balanceRef.current.prevBalance;
        const currentBalance = balanceRef.current.balance;
        balanceRef.current = {prevBalance: currentBalance, balance: newBalance};
        if (currentBalance !== newBalance || previousBalance !== currentBalance) {
          setBalance({prevBalance: currentBalance, balance: newBalance});
        }
      } else {
        balanceRef.current = {prevBalance: newBalance, balance: newBalance};
        setBalance({prevBalance: newBalance, balance: newBalance});
      }
    } else {
      if (balanceRef.current !== null) {
        balanceRef.current = null;
        setBalance(null);
      }
    }
    loadingBalanceRef.current = false;
  }


  React.useEffect(() => {
    loadingBalanceRef.current = true;
    fetchBalance();
    const interval = setInterval(() => {
      if (!loadingBalanceRef.current ) {
        loadingBalanceRef.current = true;
        fetchBalance();
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      loadingBalanceRef.current = false;
      balanceRef.current = null;
      setBalance(null);
    }
  }, [currentAccount?.address, client]);


  const loadGameAsync = async (digest: string) => {
    var retriesLeft = 3;
    while (retriesLeft > 0) {
      try {
        const gameData = await client.getTransactionBlock({ digest: digest, options: {showObjectChanges: true, showEffects: true} });
        // @ts-ignore
          for (const objectChange of gameData.objectChanges) {
            if (objectChange.type === "created") {
              if (isGameObject(objectChange.objectType, packageId, GameObject.GameV2)) {
                navigate(`/game/${objectChange.objectId}`);
              }
            }
          }
        break;
      } catch (error) {
        console.log(retriesLeft +  " error: " + error);
        // sleep 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retriesLeft -= 1;
      }
    }
  }

  const handleStartNewGame = (params: StartGameParams) => {
    if (localPrivateKey === '') {
      alert("Invalid private key");
      return;
    }
    enqueueSnackbar(`Starting new game, please ensure your wallet set to ${ctx.network}...` , {variant: 'info'});
    const txb = new TransactionBlock();
    startNewGame(packageId, txb, ADMIN_ADDRESS, params.smallBlind.toString(), params.bigBlind.toString()).then((txb) => 
      signAndExecuteTransactionBlock({
        transactionBlock: txb,
        chain: 'sui:devnet',
      },
        {
          onSuccess: (data) => {
            loadGameAsync(data.digest);
          },
          onError: (error) => {
            console.log('error executing transaction block', error);
          }
        },
      )
    );
  };

  const getGameStates = async (client: SuiClient) => {
    const gameStates = await getAllGames(packageId, client, ADMIN_ADDRESS);
    return gameStates;
  };

  return (
    <div className="App">
    <ThemeProvider theme={settings?.darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box
      display="flex" 
      flexDirection="column"
      // justifyContent="center"
      alignItems="center"
       sx={{ width: '100%', border: 0,
       height: '100vh'
      }}
      >
 
      <ButtonAppBar onStartNewGame={handleStartNewGame} formatAmount={formatAmount} toggleTheme={toggleTheme} 
        walletConnected={currentAccount?.address !== undefined}
       walletBalance={balance} light={!dark}
       setSettings={setSettings}
        settings={settings!}
       />
       { true && 
       <Box
       sx={{
        mt: '-4px',
        width: '50%',
        position: 'absolute',
       }}
       >
              <Box sx={{ zIndex: 2000 }} className={`zkp-display${loadingResources ? '' : '-hidden'}`}>

              <PopupBody className={`zkp-display${loadingResources ? '' : '-hidden'}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', width: '100%' }}>
              <Typography variant="body1" color="secondary">Loading resources...</Typography>
              <LinearProgressWithLabel value={resourceProgress} />
              </Box>
              </PopupBody>
              </Box>
        
        </Box>
        }
      <Routes>
        <Route
          path="/"
          element = {
          <Lobby
          suiClient={client}
          getGameStates={getGameStates}
          onStartNewGame={handleStartNewGame}
          walletConnected={currentAccount?.address !== undefined}
          walletBalance={balance ? balance.balance : 0}
          />}
        />
        <Route path="/game/:id" element={
          <GamePage
          packageId={packageId}
          privateState={
            {
              privateKey: localPrivateKey ?? null,
              publicKey: (localPrivateKey) ? privateToPublic(localPrivateKey) : null,
            }
          }
          formatLink={formatLink}
          walletBalance={balance}
          settings={settings!}
          resourcesLoaded={!loadingResources}
          />
        } />
      </Routes>
    </Box>
    </ThemeProvider>
    </div>
  );
}

export default App;
