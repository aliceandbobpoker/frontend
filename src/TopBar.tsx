import * as React from 'react';
// import AppBar from '@mui/material/AppBar';
import { useSuiClientContext,
  ConnectButton,
	useCurrentAccount,
 } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';
import { alpha } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Checkbox from '@mui/material/Checkbox';
import CloseIcon from '@mui/icons-material/Close';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { popoverClasses } from "@mui/material/Popover";
import { createSvgIcon } from '@mui/material/utils';
import SettingsIcon from '@mui/icons-material/Settings';
import Tooltip from '@mui/material/Tooltip';
import { ReactComponent as Logo } from "./pokericon6.svg";
import SvgIcon from '@mui/material/SvgIcon';
import { useSnackbar } from 'notistack';

import CountUp from 'react-countup';


import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { requestSuiFromFaucetV0, getFaucetHost } from '@mysten/sui.js/faucet';


import { StartGameDialog, StartGameParams } from './GameControls';

import { Link } from "react-router-dom";

import { Settings } from './Settings';

const FaucetIcon = createSvgIcon(
  // credit: plus icon from https://heroicons.com/
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#D3D3D3" d="M19 14v2h-3v-1.72zm0-1c0-1.1-1-2-2.2-2H10v-1H5v11h5v-7.09zM5 9h5V7l5.36-1.79a.932.932 0 1 0-.61-1.76L5 7z"/></svg>,
  'Plus',
);

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  },
  // elevation: ,
  ),
  ...(open && {
  }),
}));

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity,
        ),
      },
    },
  },
}));

export type BalanceTransitionProps = {
  prevBalance: number,
  balance: number,
}

interface ButtonAppBarProps {
  onStartNewGame: (params: StartGameParams ) => void;
  formatAmount: (balance: number) => string;
  toggleTheme: () => void;
  light: boolean;
  walletConnected: boolean;
  walletBalance: BalanceTransitionProps | null;
  setSettings: (newSettings: Settings) => void;
  settings: Settings;
}



const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));


interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: (newSettings: Settings) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = (props) => {
  return (
    <BootstrapDialog
    onClose={props.onClose}
    aria-labelledby="customized-dialog-title"
    open={props.open}
  >
    <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
      Preferences
    </DialogTitle>
    <IconButton
      aria-label="close"
      onClick={() => props.onClose()}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: (theme) => theme.palette.grey[500],
      }}
    >
      <CloseIcon />
    </IconButton>

    

    
    <DialogContent dividers>
       <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={props.settings.centered} onChange={() => props.setSettings({...props.settings, centered: !props.settings.centered})} />}
          label="Center seat when in game"
          sx={{ '& .MuiTypography-root': { fontSize: 20 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={props.settings.darkMode} onChange={() => props.setSettings({...props.settings, darkMode: !props.settings.darkMode})} />}
          label="Dark mode"
          sx={{ '& .MuiTypography-root': { fontSize: 20 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={props.settings.useClassic} onChange={() => props.setSettings({...props.settings, useClassic: !props.settings.useClassic})} />}
          label="Use classic theme"
          sx={{ '& .MuiTypography-root': { fontSize: 20 } }}
        />
        <FormControlLabel
        control={<Checkbox checked={props.settings.muteSound} onChange={() => props.setSettings({...props.settings, muteSound: !props.settings.muteSound})} />}
        label="Mute sounds"
        sx={{ '& .MuiTypography-root': { fontSize: 20 } }}
      />
      </FormGroup>
    </DialogContent>
  </BootstrapDialog>
  );
}
  


export default function ButtonAppBar(props: ButtonAppBarProps) {
  const currentAccount = useCurrentAccount();
  const ctx = useSuiClientContext();
  const { enqueueSnackbar } = useSnackbar();



  let currentlyHovering = false;
  const [playOpen, setPlayOpen] = React.useState(false);
  const [networkOpen, setNetworkOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const playAnchorRef = React.useRef<HTMLButtonElement>(null);
  const networkAnchorRef = React.useRef<HTMLButtonElement>(null);
  const [playAnchorEl, setPlayAnchorEl] = React.useState<null | HTMLElement>(null);
  const [networkAnchorEl, setNetworkAnchorEl] = React.useState<null | HTMLElement>(null);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const handleClickOpenSettings = () => {
    setSettingsOpen(true);
  };
  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const faucetAvailable = (ctx.network === 'localnet' || ctx.network === 'testnet' || ctx.network === 'devnet') && currentAccount !== null;
  const getTokensFromFaucet = () => {
    if (ctx.network === 'localnet' || ctx.network === 'testnet' || ctx.network === 'devnet' ) {
      const faucetUrl = getFaucetHost(ctx.network);
      if (currentAccount?.address) {
        requestSuiFromFaucetV0({
          host: faucetUrl,
          recipient: currentAccount?.address,
        }).then((response) => {
          if (response.error) {
            console.log('error: ' + response.error);
            enqueueSnackbar(`Faucet error, please try again later.`, { variant: 'error' });
          } else {
            const amountReceived = response.transferredGasObjects[0].amount;
            const formattedAmount = props.formatAmount(amountReceived);
            enqueueSnackbar(`Received ${formattedAmount} SUI on ${ctx.network}!`, { variant: 'success' });
          }
        }).catch((error) => {
          console.log('error: ' + error);
          enqueueSnackbar(`Faucet error, please try again later.`, { variant: 'error' });
        });
      } else {
      }
    }
  };

  const formatAmount = props.formatAmount;
  // const wrappedFormatAmount = React.useCallback((amount: number): string => {
  //   return `${formatAmount(amount)} SUI`;
  // }, []);

  const getBalanceEl = () => {
    if (props.walletBalance === null) {
      return (
        <div className="coin-balance">
          0
        </div>
      )
    } else {

      return (
        <div className="coin-balance">
          <CountUp start={props.walletBalance?.prevBalance} end={props.walletBalance.balance} duration={2} decimals={0}
           formattingFn={formatAmount} redraw={false}
           />
        </div>
      )
    }
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (playAnchorEl !== event.currentTarget) {
      setPlayAnchorEl(event.currentTarget);
    }
    setPlayOpen(true);
  }

  function handleHover(event: React.MouseEvent<HTMLUListElement, MouseEvent>) {
    currentlyHovering = true;
  }

  function handleClose() {
    setPlayAnchorEl(null);
    setPlayOpen(false);
  }

  function handleCloseHover() {
    currentlyHovering = false;
    setTimeout(() => {
      if (!currentlyHovering) {
        handleClose();
      }
    }, 50);
  }


  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleClickOpen = () => {
    setDialogOpen(true);
    setPlayOpen(false);
  };


  const handlePlayToggle = () => {
    setPlayOpen((prevOpen) => !prevOpen);
  };


  const handleNetworkToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('network toggle');
    setNetworkOpen((prevOpen) => !prevOpen);
    setNetworkAnchorEl(event.currentTarget);
  };

  return (
    <Box>
      <AppBar position="fixed" open={playOpen}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 2,
      }}
      >
        <Toolbar variant="dense"
          sx={{
            "@media (min-width: 0px)": { paddingRight: 0, paddingLeft: 0 },
            height: 50,
          }}
        >
        <Button
          component={Link}
          to={"/"} 
          sx={{
            padding: 0,
          }}
          >
          <SvgIcon sx = {
          {
            width: 50,
            height: 50,
            bgcolor: 'transparent',
          }}
          viewBox="00 0 1100 1100">
          <Logo />
        </SvgIcon>
        </Button>
        <Typography
          variant="h5"
          // noWrap
          component={Link}
          to={"/"} 
          sx={{
            // mr: 2,
            // display: { md: 'flex' },
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'fixedsys',
            // fontWeight: 700,
            letterSpacing: '.05rem',
            color: 'inherit',
            textDecoration: 'none',
            // width: 550,
          }}
        >
          aliceandbob.poker
        </Typography>

      <Button
        color="inherit"
        variant="text"
        ref={playAnchorRef}
        id="composition-button"
        aria-controls={playOpen ? 'composition-menu' : undefined}
        aria-expanded={playOpen ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handlePlayToggle}
        onMouseOver={handleClick}
        onMouseLeave={handleCloseHover}
      >
        Play
      </Button>
        <StyledMenu
          id="simple-menu"
          anchorEl={playAnchorEl}
          open={playOpen}
          onClose={handleClose}
          MenuListProps={{
            onMouseEnter: handleHover,
            onMouseLeave: handleCloseHover,
            style: { pointerEvents: "auto" }
          }}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
          sx={{
            [`&.${popoverClasses.root}`]: {
              pointerEvents: "none",
              borderRadius: "50px",
            },
            // make items text dark
            '& .MuiMenuItem-root': {
              // color: '#000000',
            },
            
            borderRadius: "50px",
          }}
        >
          <MenuItem component={Link} to={"/"} onClick={() => {setPlayOpen(false)}} >Lobby</MenuItem>
          {props.walletConnected ?
          <MenuItem onClick={handleClickOpen}
          >New Game</MenuItem> : <MenuItem disabled
          >New Game</MenuItem>
          }
        </StyledMenu>

        <Grid container
         alignContent="flex-end"
        sx={{ justifyContent: 'flex-end' }}
        >
          {props.walletBalance !== null ?     
            <Tooltip title="Your balance">
          <Box
              sx = {{
              }}
            display="flex"
            justifyContent="center"
            alignItems="center">
            
          <AccountBalanceRoundedIcon /> {getBalanceEl()}
                    
              </Box>
              </Tooltip>
               : <div></div>
          }

          {faucetAvailable ? 
          <Tooltip title={`Request ${ctx.network} tokens`}>
            <span>
                    <Button
                    sx={{
                      height: '100%',
                    }}
                    onClick={getTokensFromFaucet}>
                       <FaucetIcon color="secondary"></FaucetIcon>
                    </Button>
            </span>
          </Tooltip>
          :
          <Tooltip title={(currentAccount === null ? 'Connect wallet to request tokens' : `Faucet unavailable on ${ctx.network}`)}>
            <span>
          <Button disabled
            sx={{
              height: '100%',
            }}
          onClick={getTokensFromFaucet}>
             <FaucetIcon color="secondary"></FaucetIcon>
          </Button>
          </span>

          </Tooltip>
          }

          <React.Fragment>
          <Tooltip title="Preferences">
          <Button
          size={'small'}
            onClick={handleClickOpenSettings}>
              <SettingsIcon color="secondary">
              </SettingsIcon>
            </Button>
          </Tooltip>
          <SettingsDialog settings={props.settings} setSettings={props.setSettings} open={settingsOpen} onClose={handleCloseSettings} />
          </React.Fragment>

          <Button
            color="inherit"
            variant="text"
            ref={networkAnchorRef}
            id="composition-button"
            aria-controls={networkOpen ? 'composition-menu' : undefined}
            aria-expanded={networkOpen ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleNetworkToggle}
            endIcon={<KeyboardArrowDownIcon />}
          >
            {`${ctx.network}`}
          </Button>


          <StyledMenu
            id="network-menu"
            anchorEl={networkAnchorEl}
            open={networkOpen}
            onClose={() => setNetworkOpen(false)}
            MenuListProps={{
              'aria-labelledby': 'network-button',
            }}
            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
            style={{
              zIndex: 10000,
              opacity: 1,
            }}
          >
            {Object.keys(ctx.networks).map((network) => {
              if (network === 'localnet') {
                return null;
              }
              const enabled = network === 'devnet';
              const displayName = network === 'devnet' ? 'devnet' : `${network} (coming soon)`;
              return (
                <MenuItem key={network} 
                disabled={!enabled}
                sx={{
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.action.hover,
                  },
                  'font-size': '1rem',
                  'opacity': 1,
                }
                }
                onClick={() => 
                  {
                  setNetworkOpen(false);
                  ctx.selectNetwork(network);
                  }}
                  >{`${displayName}`}</MenuItem>
              );
              
            }
            )
            }
          </StyledMenu>
          <Box sx={{
           }}>
          <ConnectButton
          >
            "hi"
          </ConnectButton>
          </Box>
        </Grid>
      </Toolbar>
      </AppBar>
      <StartGameDialog
      open={dialogOpen}
      onClose={handleDialogClose}
      onStart={props.onStartNewGame}
    />
    </Box>
  );
}