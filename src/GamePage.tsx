import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';

import { useParams } from 'react-router-dom';
import {Point, GameEvent } from 'aliceandbob-client';


import { EventId } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { closeSnackbar, SnackbarKey, useSnackbar } from 'notistack';
import fetchProgress, { FetchProgressData } from 'fetch-progress';

import {
  useSwitchAccount,
	useCurrentAccount,
	useSignAndExecuteTransactionBlock,
  useSuiClient,
  useSuiClientContext,
} from '@mysten/dapp-kit';

// import { WebSocket } from 'ws';

import ClassicGameStateRenderer from './GameStateRenderer';
import GameStateRenderer, {PlayerEvent} from './NewGameStateRenderer';

import BetControls from './BetControls';
import LeaveControls from './LeaveControls';
import  { parseAction }  from './GameBackdrop';
import AlertManager, {AlertManagerProps} from './AlertManager';
import GameInfo from './GameInfo';
import GameHistory from './GameHistory';

import { addData, Stores, getStoreRecord, Zkey, deleteStoreRecord } from './db';
import { ADMIN_ADDRESS, WASM_PATHS, ZKEYS } from './Constants';


import {getAdminState,
    getPlayerStates, parseGameState,
    getGame, handleAction, getAction,
    privateToPublic,
    //  PrivateState,
      BetType, ActionType, Action,
      zeroEncryptLocal,
      getRandomScalar,
      parseGameEvent,
      getC1ForRounds,
      proveDecrypt,
      actionsAreSame
  } from 'aliceandbob-client';
import { SuiType } from './SuiType';
import { BalanceTransitionProps } from './TopBar';
import { Settings } from './Settings';




// Let react-fetch-progressbar know what the original fetch is.
// setOriginalFetch(window.fetch);
// // @ts-ignore
// window.fetch = progressBarFetch;

//const snarkjs = require("snarkjs");
const js_crypto_1 = require("@iden3/js-crypto");
// const ACTION_TIMEOUT = 10000;

const MAX_PLAYERS = 5;

export type PrivateState = {
    privateKey: string | null,
    publicKey: Point | null,
    // address: string,
}

// @ts-ignore
function randomScalars(sz) {
    var rands = [];
    for (var i=0; i<sz; i++) {
        const rand = getRandomScalar(js_crypto_1.babyJub.subOrder).toString();
        rands.push(rand);
    }
    return rands;
}


export const getZkey = async (key: string, onProgress: (progress: FetchProgressData) => void): Promise<Zkey> => {
  const zkey = await getStoreRecord<Zkey>(Stores.ZKeys, key);
  if (zkey === undefined) {
    var pathToFetch;
    if (key === 'zero_encrypt_0001') {
      pathToFetch = `zkey/${key.replace('_0001', '')}`;
    } else if (key === 'encrypt_shuffle_0001') {
      pathToFetch = `zkey/${key.replace('_0001', '')}`;
    }
    else {
      pathToFetch = `/${key}.zkey`;
    }
    var headers;
    if (process.env.NODE_ENV === 'development') {
      pathToFetch = `http://localhost:8080/${pathToFetch}`;
      headers = {};
    } else {
      headers = {
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked',
      };
    }
    const zkeyData = await fetch(pathToFetch, {
      method: 'GET',
      headers: headers,
    }).then( function (res) {
      const contentLength = res.headers.get('Mycontent-Length');
      if (contentLength) {
        const newHeaders = new Headers(res.headers);
        newHeaders.set('content-length', contentLength);
        return new Response(res.body, { headers: newHeaders });
      }
      return res;
    }).then(
      fetchProgress({
        onProgress: onProgress,
      })
    )
    .then( function(res) {
        return res.arrayBuffer();
    }).then(function (ab) {
        return new Uint8Array(ab);
    });
    // @ts-ignore
    const zkey = {o: {id: key, type: "mem", data: zkeyData}};
    try {
      await addData(Stores.ZKeys,  { ...zkey.o });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(err.message);
      } else {
        console.log('Something went wrong');
      }
    }
    return zkey.o;
  } else {
    return zkey;
  }
}

const addCachedZeroEncrypt = async (zeroEncrypt: any) => {
  const key = zeroEncrypt.pubKeyX + "_" + zeroEncrypt.pubKeyY;
  try {
    addData(Stores.ZeroEncrypts,  { id: key, data: JSON.stringify(zeroEncrypt) });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
    } else {
      console.log('Something went wrong adding zeroEncrypt');
    }
  }
}

const getCachedZeroEncrypt = async (pubKeyX: string, pubKeyY: string) => {
  const zeroEncryptData = await getStoreRecord<any>(Stores.ZeroEncrypts, pubKeyX + "_" + pubKeyY);
  const zeroEncrypt = zeroEncryptData === undefined ? undefined : zeroEncryptData.data;
  if (zeroEncrypt === undefined) {
    return null;
  } else {
    return zeroEncrypt;
  }
}

const removeCachedZeroEncrypt = async (pubKeyX: string, pubKeyY: string) => {
  await deleteStoreRecord(Stores.ZeroEncrypts, pubKeyX + "_" + pubKeyY);
}
  

interface LastEvents {
  digest: string;
  events: PlayerEvent[];
}

interface GamePageProps {
  packageId: string;
  privateState: PrivateState;
  formatLink: (id: string, suiType: SuiType) => string | null;
  walletBalance: BalanceTransitionProps | null;
  settings: Settings;
  resourcesLoaded: boolean;
}

export interface GameEvents {
  events: PlayerEvent[];
  snapshot: boolean
}

// @ts-ignore
async function createProofZeroEncrypt(rands: string[], pubKeyX: string, pubKeyY: string, shuffleCount: number) {
  const zeroEncryptZkey = await getZkey('zero_encrypt_0001', (progress) => {});
  // @ts-ignore
  const snarkjs = (typeof window === 'undefined') ? require("snarkjs") : window.snarkjs;

  const {proof, publicSignals} = await snarkjs.groth16.fullProve({randomVal: rands.map(x => {return BigInt(x);}),
      pubKey_x: BigInt(pubKeyX), pubKey_y: BigInt(pubKeyY) }, "/zero_encrypt.wasm", zeroEncryptZkey);
  const localZeroEncrypts = zeroEncryptLocal(rands, pubKeyX, pubKeyY);
  const proofZeroEncrypt_obj = {shuffledCount: shuffleCount, pubKeyX: pubKeyX, pubKeyY: pubKeyY, rands: rands,
      zeroEncrypts: localZeroEncrypts,
      proof: proof, publicSignals: publicSignals};
  addCachedZeroEncrypt(proofZeroEncrypt_obj);
  console.log("set proofZeroEncrypt to localStorage at ", Math.floor(Date.now()/1000), proofZeroEncrypt_obj);
}

const GamePage: React.FC<GamePageProps> = ({ packageId, privateState, formatLink, walletBalance, settings, resourcesLoaded }) => {
    const [alert, setAlert] = useState<AlertManagerProps | null>(null);
    const otherPlayerActionSnackbar = useRef<SnackbarKey | null>(null);
    const [pendingAction, setPendingAction] = useState<Action | null>(null);
    const performedActionRef = useRef<Action | null>(null);
    const pendingActionRef = useRef<Action | null>(null);
    const addressRef = useRef<string | null>(null);
    const [gameState, setGameState] = useState<any | null>(null);
    const [parsedGameState, setParsedGameState] = useState<any | null>(null);
    const [ownState, setOwnState] = useState<any | null>(null);
    const [isInGame, setIsInGame] = useState<boolean>(false);
    const [leaveAction, setLeaveAction] = useState<any | null>(null);
    const [gameEvents, setGameEvents] = useState<GameEvents>({events: [], snapshot: false});
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading...');
    const loadingRef = useRef(false);
    const loadingStateRef = useRef(false);
    const loadedGameRef = useRef(false);
    const ownBetRef = useRef(false);
    const [ownBet, setOwnBet] = useState(false);
    const ownBetActionRef = useRef<any | null>(null);

    const [canJoin, setCanJoin] = useState(false);
    const [canJoinAction, setCanJoinAction] = useState<any | null>(null);
    const [currentBetPlayer, setCurrentBetPlayer] = useState<string | null>(null);
    const cachingShuffle = useRef<boolean>(false);
    const cachingDecrypt = useRef<boolean>(false);
    const lastEventsRef = useRef<LastEvents | null>(null);
    const gameEventsRef = useRef<PlayerEvent[]>([]);
    const fetchingNewEvents = useRef<boolean>(false);

    const eventCursorRef = useRef<EventId | null | undefined>(null);

    const cachedDecrypts = useRef<any>({});
    const ctx = useSuiClientContext();

    const { enqueueSnackbar } = useSnackbar();
    const snackBarMessage = `Please ensure your wallet is set to ${ctx.network} and approve tx...`;

    var [shuffleCount, setShuffleCount] = useState(0);
    // const [proofZeroEncrypt, setProofZeroEncrypt, removeProofZeroEncrypt] = useLocalStorage('proof_zero_encrypt', '');
    const { id } = useParams();

    const currentAccount = useCurrentAccount();
    useSwitchAccount();
    const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
    const client = useSuiClient();
  
    const privateKey = privateState.privateKey;

    const formatAmount = (amount: number) => {
      return (amount / (10 ** 9)).toFixed(2).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1');
    };



    async function createDecryptProofs(c1s: Point[]) {
      cachingDecrypt.current = true;
      if (cachedDecrypts.current.c1ToProofInput) {
        // if c1s is a subset of cached c1s, then we don't need to create new proofs
        if (c1s.find(c1 => {
          return !cachedDecrypts.current.c1ToProofInput.hasOwnProperty(c1.x + "_" + c1.y);
        })) {
        } else {
          console.log("Using cached decrypt proofs");
          return;
        }
      }


      const allProofs = [];
      const allInputs = [];
      for (const c1 of c1s) {
        const [proof, inputs] = await proveDecrypt(c1.x, c1.y, privateKey!, WASM_PATHS.decrypt, ZKEYS.decryptZkey);
        allProofs.push(proof);
        allInputs.push(inputs);
      }
      const c1ToProofInput: {[key: string]: any} = {};
      for (var i = 0; i < c1s.length; i++) {
        c1ToProofInput[c1s[i].x + "_" + c1s[i].y] = {proof: allProofs[i], inputs: allInputs[i]};
      }
      cachedDecrypts.current = {c1ToProofInput: c1ToProofInput};
      if (ownBetRef.current && ownBetActionRef.current !== null) {
        ownBetActionRef.current.payload.c1ToProofInput = c1ToProofInput;
      }
    }

    useEffect(() => {
      console.log('shuffleCount change handler start: shuffleCount: ', shuffleCount, ' with ts=', Math.floor(Date.now()/1000));
      if (gameState && gameState.group_public_key && gameState.group_public_key.fields &&
        gameState.group_public_key.fields.x !== "0" && gameState.group_public_key.fields.y !== "1"
        && isInGame
        && (addressRef.current !== null)
        && (pendingAction === null || (pendingAction.type !== ActionType.SHUFFLE  && pendingAction.type !== ActionType.DECRYPT))
        && !cachingShuffle.current
        ) {

          let roundsToDecrypt = [];
          for (var i = 0; i < gameState.rounds.length; i ++) {
            if (i >= gameState.decrypt_round || i === 0) {
              roundsToDecrypt.push(i);
            }
          }
          const { c1s } = getC1ForRounds(gameState, roundsToDecrypt, addressRef.current, true);
          if (!cachingDecrypt.current) {
            createDecryptProofs(c1s)
            .finally(() => {
              cachingDecrypt.current = false;
            });
          };
          cachingShuffle.current = true;
          getCachedZeroEncrypt(gameState.group_public_key.fields.x, gameState.group_public_key.fields.y).then(
            (cachedProofZeroEncrypt) => {
              var cachedIsValid = false;
              if (!(cachedProofZeroEncrypt === '' || cachedProofZeroEncrypt === undefined || cachedProofZeroEncrypt === null)) {
                const parsedProofZeroEncrypt = JSON.parse(cachedProofZeroEncrypt);
                const cachedProofPublicKeyX = parsedProofZeroEncrypt.pubKeyX;
                const cachedProofPublicKeyY = parsedProofZeroEncrypt.pubKeyY;
                if (cachedProofPublicKeyX === gameState.group_public_key.fields.x
                    && cachedProofPublicKeyY === gameState.group_public_key.fields.y) {
                    cachedIsValid = true;
                }
              }
              if (!cachedIsValid) {
                console.log("Creating cached proofZeroEncrypt in GamePage");
                var rands = randomScalars(52);
                createProofZeroEncrypt(rands, gameState.group_public_key.fields.x, gameState.group_public_key.fields.y, shuffleCount).finally(() => {
                  cachingShuffle.current = false;
                });
              } else {
                cachingShuffle.current = false;
              }
            }
          )
      }
    }, [gameState, isInGame, pendingAction, shuffleCount]);

    const getActionDisplay = (action: Action): string | null => {
      if (action.type === ActionType.SHUFFLE) {
        return "Waiting for other players to shuffle";
      } else if (action.type === ActionType.DECRYPT) {
        return "Waiting for other players to decrypt";
      } else if (action.type === ActionType.BLIND_BET) {
        return "Waiting for other players to place blind bets";
      } else if (action.type === ActionType.START) {
        return "Waiting for game to start";
      }
      return null 
    }

    const leaveGame = () => {
      var txb = new TransactionBlock();
      handleAction(packageId, txb, leaveAction, privateKey!, WASM_PATHS, ZKEYS).then(() => {
        enqueueSnackbar(`Leaving game. ${snackBarMessage}` , {variant: 'info'});
        signAndExecuteTransactionBlock({
          transactionBlock: txb,
        },
          {
            onSuccess: (result) => {
              console.log('executed transaction block', result);
            },
            onError: (error) => {
              console.log('error executing transaction block', error);
            }
          });
      });
    }

    const handleNewEvents = (events: PlayerEvent[]) => {
      const isSnapshot = gameEventsRef.current.length === 0;
      for (const e of events) {
        gameEventsRef.current.push(e);
      }
      const newGameEvents = {
        events: [...gameEventsRef.current],
        snapshot: isSnapshot
      }
      setGameEvents(newGameEvents);

      for (const event of events) {
        if (lastEventsRef.current === null || lastEventsRef.current.digest !== event.digest) {
          lastEventsRef.current = {digest: event.digest, events: [event]};
        } else {
          lastEventsRef.current.events.push(event);
        }
      }
    }

    const joinGame = (amount: number, seat: number) => {
      var txb = new TransactionBlock();
      // canJoinAction.payload.gameId = id;
      canJoinAction.payload.balance = Math.floor(amount * (10 ** 9));
      canJoinAction.payload.seat = seat;
      handleAction(packageId, txb, canJoinAction, privateKey!, WASM_PATHS, ZKEYS).then(() => {
        enqueueSnackbar(`Joining game. ${snackBarMessage}` , {variant: 'info'});
        signAndExecuteTransactionBlock({transactionBlock: txb}, 
          {
            onSuccess: (result) => {
              console.log('executed transaction block', result);
            },
            onError: (error) => {
              console.log('error executing transaction block', error);
            }
          });
      });
    }
    
    const loadState = (id: string) => {
      // get admin first otherwise weird things happen with stale actions
      const getAdminStateFuture = getAdminState(packageId, client, ADMIN_ADDRESS);
      Promise.all([getAdminStateFuture]).then(async ([data]) => {
        if (loadingStateRef.current) {
          return;
        }
        loadingStateRef.current = true;
        try {


          const gameState = await getGame(client, id);
        const parsedGameState = parseGameState(gameState, (privateKey != null && addressRef.current) ? {
        privateKey: privateKey,
        publicKey: privateToPublic(privateKey),
        player: addressRef.current,
        } : undefined );

        setParsedGameState(parsedGameState);
        const ownPlayerState = addressRef.current ? parsedGameState.playerStates[addressRef.current] : null;
        setOwnState(ownPlayerState);
        var foundOtherAction = false;
        var currentBetPlayer = null;
        const currentAccountAddress = addressRef.current === null ? '' : addressRef.current;

        let playersState = await getPlayerStates(packageId, client, gameState.players);
        let actions = getAction(packageId, gameState, playersState, data, currentAccountAddress);
        var txb = new TransactionBlock();
        var didAction = false;
        var actionToPerform = null;
        var futures = [];
        
        var foundBetAction = false;
        var foundJoinAction = false;
        var foundLeaveAction = false;
        var foundShuffleAction = false;
        var currentAction: Action | null = null;
        var otherPlayerAction = null;

        for (const action of actions) {
          if (!action.admin && action.from! === currentAccountAddress && currentAccountAddress !== '') {
            if (action.type === ActionType.JOIN) {
              foundJoinAction = true;
              setCanJoin(true);
              setCanJoinAction(action);
            } else if (action.type === ActionType.BET) {
              foundBetAction = true;
              setOwnBet(true);
              ownBetActionRef.current = action;
              ownBetRef.current = true;
              currentBetPlayer = action.from;
              if (cachedDecrypts.current !== null) {
                const c1ToProofInput = cachedDecrypts.current.c1ToProofInput;
                if (c1ToProofInput !== null && c1ToProofInput !== undefined) {
                  for (const [key, value] of Object.entries(c1ToProofInput)) {
                    console.log("adding c1ToProofInput to action: " + key + " " + JSON.stringify(value));
                    action.payload.c1ToProofInput[key] = value;
                  }
                }
              }
            }
            else if (action.type === ActionType.LEAVE) {
              foundLeaveAction = true;
              setLeaveAction(action);
            } 
            else {
              let passInZkeys: any = {...ZKEYS};
              if (privateKey == null) {
                console.log("Private Key Not Found");
                return;
              }
              // if (JSON.stringify(action) === JSON.stringify(performedActionRef.current)) {
              if ((performedActionRef.current !== null) && actionsAreSame(action, performedActionRef.current)) {
                continue;
              }
              if ((pendingActionRef.current !== null) && actionsAreSame(action, pendingActionRef.current)) {
                continue;
              }

              if (pendingActionRef.current !== null) {
                continue;
              }
              didAction = true;
              actionToPerform = action;
              setPendingAction(action);
              if (actionToPerform.type === ActionType.SHUFFLE) {
                enqueueSnackbar(parseAction(action, false), {variant: 'info'});
              }
              currentAction = action;
              pendingActionRef.current = currentAction;
              
              if (action.payload && (action.type === ActionType.SHUFFLE)) {
                const zeroEncryptZkey = await getZkey('zero_encrypt_0001', (progress) => {});
                const encryptShuffleZkey = await getZkey('encrypt_shuffle_0001', (progress) => {});
                passInZkeys = {zeroEncryptZkey: zeroEncryptZkey, encryptShuffleZkey: encryptShuffleZkey};

                action.payload.proofZeroEncrypt = null;
                const cachedProofZeroEncrypt = await getCachedZeroEncrypt(action.payload.pubKeyX, action.payload.pubKeyY);
                console.log("cachedProofZeroEncrypt: " + cachedProofZeroEncrypt);
                if (cachedProofZeroEncrypt !== null && cachedProofZeroEncrypt !== undefined && cachedProofZeroEncrypt !== '') {
                    // @ts-ignore
                    const p_o =  JSON.parse(cachedProofZeroEncrypt);
                    const grp_pub_key = gameState.group_public_key.fields;
                    if (p_o.pubKeyX === grp_pub_key.x && p_o.pubKeyY ===  grp_pub_key.y) {
                      console.log("using valid proofZeroEncrypt from localStorage")
                      action.payload.proofZeroEncrypt = p_o;
                    } else {
                      console.log("invalid cachedProofZeroEncrypt in localStorage" + p_o.pubKeyX + " " + p_o.pubKeyY + " " + grp_pub_key.x + " " + grp_pub_key.y);
                    }
                } else {
                  console.log("cachedProofZeroEncrypt not found in localStorage");
                }
                foundShuffleAction = true;
              } else if (action.payload && (action.type === ActionType.DECRYPT || action.type === ActionType.DECRYPT_MANY)) {
                // iterate over cachedDecrypts
                if (cachedDecrypts.current !== null) {
                  const c1ToProofInput = cachedDecrypts.current.c1ToProofInput;
                  if (c1ToProofInput !== null && c1ToProofInput !== undefined) {
                    for (const [key, value] of Object.entries(c1ToProofInput)) {
                      console.log("adding c1ToProofInput to action: " + key + " " + JSON.stringify(value));
                      action.payload.c1ToProofInput[key] = value;
                    }
                  }
                }
              }
              let handleActionFuture = handleAction(packageId, txb, action, privateKey, WASM_PATHS, passInZkeys);
              futures.push(handleActionFuture);
            }
          } else if (!action.admin) {
            if (action.type === ActionType.JOIN) {
            } else if (action.type === ActionType.BET && action.from !== undefined) {
              // setCurrentBetPlayer(action.from);
              currentBetPlayer = action.from;
            } else {
              otherPlayerAction = getActionDisplay(action);
              if (otherPlayerAction && !didAction && isInGame) {
                if (otherPlayerActionSnackbar.current !== null) {
                  closeSnackbar(otherPlayerActionSnackbar.current);
                }
                const snackbarKey = enqueueSnackbar(`Waiting for other players to ${action.type}` , {variant: 'info', persist: true});
                otherPlayerActionSnackbar.current = snackbarKey;
              } else {
                if (otherPlayerActionSnackbar.current !== null) {
                  closeSnackbar(otherPlayerActionSnackbar.current);
                }
              }
              // setOtherPlayerActionsDisplay(otherPlayerAction);
              foundOtherAction = true;
            }
          }
        }
        setGameState(gameState);
        if (currentAccountAddress && parsedGameState.players.includes(currentAccountAddress)) {
          setIsInGame(true);
        } else {
          setIsInGame(false);
        }
        
        if (!foundOtherAction) {
          if (otherPlayerActionSnackbar.current !== null) {
            closeSnackbar(otherPlayerActionSnackbar.current);
          }
        }
        if (!foundBetAction) {
            setOwnBet(false);
            ownBetActionRef.current = null;
            ownBetRef.current = false;
        };
        if (!foundJoinAction) {
            setCanJoin(false);
            setCanJoinAction(null);
        }
        if (!foundLeaveAction) {
          setLeaveAction(null);
        }
        if (futures.length > 0) {
          await Promise.all(futures);
        }

        if (didAction) {
          // setAwaitingApproval(true);
          if (actionToPerform != null && actionToPerform.type !== ActionType.SHUFFLE) {
            enqueueSnackbar(`${parseAction(actionToPerform, false)}. ${snackBarMessage}`, {variant: 'info'});
          } else {
            enqueueSnackbar(snackBarMessage, {variant: 'info'});
          }

          await signAndExecuteTransactionBlock({transactionBlock: txb}, 
            {
              onSuccess: (result) => {
                // setAwaitingApproval(false);
                console.log('executed transaction block', result);
                pendingActionRef.current = null;
                performedActionRef.current = currentAction;
                setPendingAction(null);
                if (foundShuffleAction) {
                  removeCachedZeroEncrypt(gameState.group_public_key.fields.x, gameState.group_public_key.fields.y).then(() => {
                    setShuffleCount(shuffleCount+1);
                  });
                }
              },
              onError: (error) => {
                // setAwaitingApproval(false);
                console.log('error executing transaction block', error);
                pendingActionRef.current = null;
                setPendingAction(null);
              }
            }
          );
        }
        setCurrentBetPlayer(currentBetPlayer);
        setLoading(false);
        loadedGameRef.current = true;
        }
        catch (err) {
          console.log("error: " + err);
          setGameState(null);
          setParsedGameState(null);
          loadedGameRef.current = false;
          return;
        }
        finally {
          loadingRef.current = false;
          loadingStateRef.current = false;
        }
      });
    };

    const handleCheck = async () => {
      var txb = new TransactionBlock();
      ownBetActionRef.current.payload.betType = BetType.CHECK;
      ownBetActionRef.current.payload.amount = 0;
      await handleAction(packageId, txb, ownBetActionRef.current, privateKey!, WASM_PATHS, ZKEYS);
      enqueueSnackbar(`Checking. ${snackBarMessage}` , {variant: 'info'});
      await signAndExecuteTransactionBlock({transactionBlock: txb},
        {
          onSuccess: (result) => {
            setOwnBet(false);
            ownBetRef.current = false;
          }
        }
      );
    }

    const handleFold = async () => {
      var txb = new TransactionBlock();
      ownBetActionRef.current.payload.betType = BetType.FOLD;
      ownBetActionRef.current.payload.amount = 0;
      await handleAction(packageId, txb, ownBetActionRef.current, privateKey!, WASM_PATHS, ZKEYS);
      enqueueSnackbar(`Folding. ${snackBarMessage}` , {variant: 'info'});

      await signAndExecuteTransactionBlock({transactionBlock: txb},
        {
          onSuccess: (result) => {
            setOwnBet(false);
            ownBetRef.current = false;
          }
        }
      );
    }


    const handleBet = async (amount:number, betType: BetType) => {
      var txb = new TransactionBlock();
      ownBetActionRef.current.payload.betType = betType;
      ownBetActionRef.current.payload.amount = amount;
      await handleAction(packageId, txb, ownBetActionRef.current, privateKey!, WASM_PATHS, ZKEYS);
      let betTypeStr;
      if (betType === BetType.BET) {
        betTypeStr = 'Betting. ';
      } else if (betType === BetType.CALL) {
        betTypeStr = 'Calling. ';
      } else {
        betTypeStr = '';
      }
      try {
        
        enqueueSnackbar(`${betTypeStr}${snackBarMessage}` , {variant: 'info'});
        await signAndExecuteTransactionBlock({transactionBlock: txb},
          {
            onSuccess: (result) => {
              setOwnBet(false);
              ownBetRef.current = false;
            }
          }
        );
      }
      catch(err) {
        console.log("error: " + err);
      }

    }

    useEffect(() => {
        if (id != null) {
          setGameState(null);
          // setAdminState(null);
          setOwnState(null);
          if (currentAccount?.address) {
            addressRef.current = currentAccount.address;
          }
          

          setLoading(true);
          setLoadingMessage('Loading...');
          loadingRef.current = true;
          loadedGameRef.current = false;


          // client.subscribeEvent({
          //     filter: {
          //     Package: packageId,
          //     },
          //     onMessage(event) {
          //       const eventData: any = event['parsedJson'];
          //       const parsedGameEvent = parseGameEvent(event['type'], packageId);
          //       if (eventData['game_id'] == id && parsedGameEvent !== null) {
          //         const playerEvent = {
          //           type: parsedGameEvent,
          //           player: eventData['player'],
          //           digest: event['id']['txDigest'],
          //           values: eventData,
          //           timestamp: event['timestampMs'] ? parseInt(event['timestampMs']) : 0,
          //           eventSeq: event['id']['eventSeq'] ? parseInt(event['id']['eventSeq']) : 0,
          //         }

          //         const alert = {
          //           event: playerEvent,
          //           digest: event['id']['txDigest']
          //         }

          //         const dbEvent = {
          //           id: `${event['id']['txDigest']}_${event['id']['eventSeq']}`,
          //           game: id,
          //           data: JSON.stringify(playerEvent),
          //         }
          //         addEventToDb(dbEvent);

          //         setAlert(alert);
          //         handleNewEvent(playerEvent);
          //         console.log("new event: " + JSON.stringify(event));
          //         loadState(id);
          //       } else {
          //         console.log("ignoring event: " + JSON.stringify(event));
          //       }
          //     },
          // })
          // .then((newUnsubscribe) => {
          //   setUnsubscribe(() => () =>  {
          //     newUnsubscribe().then(success => {
          //       console.log("unsubscribe success: " + success);
          //     });
          //   });
          // });
          loadState(id);
          setTimeout(() => {
            if (!loadedGameRef.current) {
              setLoadingMessage('Unable to load game. Please check your network and try again.');
            }
          }, 10000);
        }
        const interval = setInterval(() => {
          if (id && !fetchingNewEvents.current && !loadingRef.current && loadedGameRef.current) {

            fetchingNewEvents.current = true;
            fetchEventsSinceCursor().finally(() => {
              fetchingNewEvents.current = false;
            });
          }
        }, 1000);
        return () => {
          clearInterval(interval);
          fetchingNewEvents.current = false;
        }
    }, [currentAccount?.address, client]);

    // useEffect( () => {
    //   return () => {
    //     unsubscribe();
    //   }
    // }, [unsubscribe]);

    const fetchEventsSinceCursor = async () => {
      if (id == null) {
        return;
      }
      const allPlayerEvents = [];
      var alert = null;
      while (true) {
        try {
          let useCursor = eventCursorRef.current;
          const queryParams = {
            query: {  
              MoveModule: {
                package: packageId,
                module: 'game'
              }
            },
            cursor: useCursor,
            order: "ascending",
          }
          // @ts-ignore
          const paginatedEvents = await client.queryEvents(queryParams);
          const events = paginatedEvents.data;
  
          eventCursorRef.current = paginatedEvents.nextCursor;
          for (let event of events) {
            const eventData: any = event['parsedJson'];
            const parsedGameEvent = parseGameEvent(event['type'], packageId);
            if (eventData['game_id'] === id && parsedGameEvent !== null) {
              const playerEvent: PlayerEvent = {
                type: parsedGameEvent,
                player: parsedGameEvent === GameEvent.ShuffleEvent ? eventData['from'] : eventData['player'],
                digest: event['id']['txDigest'],
                values: eventData,
                timestamp: event['timestampMs'] ? parseInt(event['timestampMs']) : 0,
                eventSeq: event['id']['eventSeq'] ? parseInt(event['id']['eventSeq']) : 0,
              }
  
              alert = {
                event: playerEvent,
                digest: event['id']['txDigest']
              }
  
              if (gameEventsRef.current.filter((e) => e.digest === event['id']['txDigest'] && e.eventSeq.toString() === event['id']['eventSeq']).length === 0) {
                allPlayerEvents.push(playerEvent);
              }
            }
          }
          if (!paginatedEvents.hasNextPage) {
            break;
          }
        }
        catch (err) {
          console.log("error fetching events: " + err);
          break;
        }
      }
      if (allPlayerEvents.length > 0) {
        loadState(id);
        if (alert && gameEventsRef.current.length > 0) {
          setAlert(alert);
        }
        handleNewEvents(allPlayerEvents);

      }
    }

    const walletConnected = walletBalance !== null;
    const haveBalance = walletBalance !== null && walletBalance.balance > 0;
    const numPlayers = parsedGameState ? parsedGameState.players.length : 0;
    var cannotJoinReason = "";
    if (resourcesLoaded) {
      if (canJoin) {
        if (!walletConnected) {
          cannotJoinReason = "Please connect wallet first";
        } else if (!haveBalance) {
          cannotJoinReason = "Not enough SUI in wallet";
        }
      } else {
        cannotJoinReason = "";
      }
    } else {
      cannotJoinReason = "Loading...";
    }

    return (
    <Box
    sx={{
      width: '100%',
      height: '100vh',
    }}>
      {(alert && !settings.muteSound) &&  <AlertManager event={alert.event} digest={alert.digest}/>}
      {loading &&
      <Box
      sx={{
        width: '0px',
         border: 0,
     }}
      >
       <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={true}
        message={loadingMessage}
        key={'topcenter'}
        sx={{
          width: '100%',
          mt: 5,
          zIndex: (theme) => theme.zIndex.drawer - 1,
       }}
      /> 
      </Box>
      }
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          height:"100vh"

        }}
      >
        <Box
      justifyContent="center"
      height="100vh"
       sx={{
        // display: 'flex',
        justifyContent: 'space-between',
         width: '75%',
          border: 0,
      }}
      >


      {gameState && <div className={`game-container${settings.useClassic ? '' : ' v2'}`}>
      {
        !settings.useClassic ? 
        <GameStateRenderer gameState={parsedGameState} privateState=
            { (privateKey !== null) && (currentAccount !== null) ?
              {
                privateKey: privateKey,
                publicKey: privateToPublic(privateKey),
                player: currentAccount.address,
              } : null
            }
        centerSelf={true}
        joinGame={joinGame}
        canJoin={canJoin && haveBalance && resourcesLoaded && (numPlayers < MAX_PLAYERS)}
        cannotJoinReason={cannotJoinReason}
        currentBetPlayer={currentBetPlayer}
        events={lastEventsRef.current ? lastEventsRef.current.events : []}
        formatLink={formatLink}
        formatAmount={formatAmount}
        walletBalance={walletBalance ? walletBalance.balance : null}
        settings={settings}
        /> : 
        <ClassicGameStateRenderer gameState={parsedGameState} privateState=
        { (privateKey !== null) && (currentAccount !== null) ?
          {
            privateKey: privateKey,
            publicKey: privateToPublic(privateKey),
            player: currentAccount.address,
          } : null
        }
        centerSelf={true}
        joinGame={joinGame}
        canJoin={canJoin && haveBalance && resourcesLoaded && (numPlayers < MAX_PLAYERS)}
        cannotJoinReason={cannotJoinReason}
        currentBetPlayer={currentBetPlayer}
        events={lastEventsRef.current ? lastEventsRef.current.events : []}
        formatLink={formatLink}
        formatAmount={formatAmount}
        walletBalance={walletBalance ? walletBalance.balance : null}
        settings={settings}
        /> }

              <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
      {isInGame && 
      <LeaveControls
      leaveGame={leaveGame}
      disabled={leaveAction === null}
      />
      }
        {(ownBet && ownState && walletBalance) && <BetControls
        onBet={handleBet}
        onCheck={() => handleCheck()}
        onFold={() => handleFold()}
        gameState={parsedGameState}
        ownState={ownState}
        walletBalance={walletBalance}
        decimals={9}
        formatAmount={formatAmount}
      />}
      {isInGame && false &&
      <Box
      sx = {{
        mt: 10,
        height: 50,
        width: '20%',
      }}
      ></Box>}

      </Box>
    </div>
      }
          </Box>

          <Box

    justifyContent="center"
    height="100vh"
     sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
       width: '25%',
        border: 0,
    }}
    >
              {parsedGameState && <GameInfo gameState={parsedGameState} formatAmount={formatAmount} formatLink={formatLink}/>}
              {(gameEvents && gameState) ?<GameHistory events={gameEvents} formatAmount={formatAmount} formatLink={formatLink}/> : <div></div>}
      </Box>
      </Box>

</Box>
    )
};

export default GamePage;
