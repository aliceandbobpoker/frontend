import ReactDOM from 'react-dom/client';
import {useLocalStorage} from 'react-use';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { alpha, createTheme, responsiveFontSizes } from "@mui/material/styles";
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { SuiClientProvider, WalletProvider,
 } from '@mysten/dapp-kit';
import { ThemeVars } from '@mysten/dapp-kit';
import { SuiClient, getFullnodeUrl, SuiHTTPTransport } from '@mysten/sui.js/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SnackbarKey, SnackbarProvider, useSnackbar } from 'notistack';

import { NETWORK_CONFIG } from './Constants';
import { getDefaultSettings } from './Settings';

const queryClient = new QueryClient();


const dappDefaultTheme: ThemeVars = {
	blurs: {
		modalOverlay: 'blur(0)',
	},
	backgroundColors: {
		primaryButton: '#F6F7F9',
		primaryButtonHover: '#F0F2F5',
		outlineButtonHover: '#F4F4F5',
		modalOverlay: 'rgba(24 36 53 / 20%)',
		modalPrimary: 'white',
		modalSecondary: '#F7F8F8',
		iconButton: 'transparent',
		iconButtonHover: '#F0F1F2',
		dropdownMenu: '#FFFFFF',
		dropdownMenuSeparator: '#F3F6F8',
		walletItemSelected: 'white',
		walletItemHover: '#3C424226',
	},
	borderColors: {
		outlineButton: '#E4E4E7',
	},
	colors: {
		primaryButton: '#373737',
		outlineButton: '#373737',
		iconButton: '#000000',
		body: '#182435',
		bodyMuted: '#767A81',
		bodyDanger: '#FF794B',
	},
	radii: {
		small: '6px',
		medium: '8px',
		large: '12px',
		xlarge: '16px',
	},
	shadows: {
		primaryButton: '0px 4px 12px rgba(0, 0, 0, 0.1)',
		walletItemSelected: '0px 2px 6px rgba(0, 0, 0, 0.05)',
	},
	fontWeights: {
		normal: '400',
		medium: '500',
		bold: '600',
	},
	fontSizes: {
		small: '14px',
		medium: '16px',
		large: '18px',
		xlarge: '20px',
	},
	typography: {
		fontFamily:
			'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
		fontStyle: 'normal',
		lineHeight: '1.3',
		letterSpacing: '1',
	},
};

export var darkTheme = createTheme({
	typography: {
	  fontFamily: [
		// 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'
		// 'fixedsys'
		// 'Hack',
		'-apple-system',
		'BlinkMacSystemFont',
		'"Segoe UI"',
		'Roboto',
		'"Helvetica Neue"',
		'Arial',
		'sans-serif',
		'"Apple Color Emoji"',
		'"Segoe UI Emoji"',
		'"Segoe UI Symbol"',
	  ].join(','),
	},
  
	breakpoints: {
	  values: {
		xs: 0,
		sm: 425,
		md: 768,
		lg: 1024,
		xl: 1280,
	  },
	},
	  palette: {
		background: {
		  default: alpha("#0f1624", 1.0)
		},
	  mode: 'dark',
	  secondary: {
		main: "#bfd7ed"
	  }
	  },
	components: {
	  MuiButton: {
		styleOverrides: {
		  root: {
			fontSize: '1rem',
			"&.Mui-disabled": {
			  // backgroundColor: '#f0ead6',
			  // color: 'red',
			}
		  },
		  outlined:{
			// color: '#f0ead6',
			// backgroundColor: '#1c1c84',
		  },
		},
	  },
	  MuiSlider: {
		styleOverrides: {
		  root: {
			color: 'white',
		  },
		},
	  },
	  MuiPaper: {
		styleOverrides: {
		  root: {
			backgroundColor: alpha('#00001c', 1),
			boxShadow: '0px 0px 0px 0px',
			// color: 'black',
		  },
		},
	  },
	  MuiListItemText: {
		styleOverrides: {
		  root: {
			// color: 'black',
		  },
		},
	  },
	  MuiAppBar: {
		styleOverrides: {
		  root: {
			backgroundColor: alpha('#00001c', 0.5),
			backgroundImage: 'none',
		  },
		},
	  },
	  MuiCssBaseline: {
		styleOverrides: {
		  body: {
			scrollbarColor: "#6b6b6b #2b2b2b",
			"&::-webkit-scrollbar, & *::-webkit-scrollbar": {
			  backgroundColor: "#2b2b2b",
			},
			"&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
			  borderRadius: 8,
			  backgroundColor: "#6b6b6b",
			  minHeight: 24,
			  border: "3px solid #2b2b2b",
			},
			"&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
			  backgroundColor: "#959595",
			},
			"&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
			  backgroundColor: "#959595",
			},
			"&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
			  backgroundColor: "#959595",
			},
			"&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
			  backgroundColor: "#2b2b2b",
			},
		  },
		},
	  },
	}
  });
  
darkTheme = responsiveFontSizes(darkTheme);

export var lightTheme = createTheme({
typography: {
	fontFamily: [
	// 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'
	// 'fixedsys',
	// 'Hack',
	'-apple-system',
	'BlinkMacSystemFont',
	'"Segoe UI"',
	'Roboto',
	'"Helvetica Neue"',
	'Arial',
	'sans-serif',
	'"Apple Color Emoji"',
	'"Segoe UI Emoji"',
	'"Segoe UI Symbol"',
	].join(','),
},
breakpoints: {
	values: {
	xs: 0,
	sm: 425,
	md: 768,
	lg: 1024,
	xl: 1280,
	},
},
	palette: {
	background: {
	default: '#fcfcff'
		// default: "#12375f"
	},
	mode: 'light',
	primary: {
	main: '#0d756b',
	light: '#42a5f5',
	dark: '#1565c0',
	contrastText: '#fff',
	},
	secondary: {
	main: "#000000"
	}
	},

components: {
	MuiButton: {
	styleOverrides: {
		root: {
		fontSize: '1rem',
		"&.Mui-disabled": {
			// backgroundColor: '#f0ead6',
			// color: 'red',
		}
		},
		outlined:{
		// color: '#f0ead6',
		// backgroundColor: '#1c1c84',
		},
	},
	},
	MuiSlider: {
	styleOverrides: {
		root: {
		// color: 'white',
		},
	},
	},
	MuiInputBase: {
	styleOverrides: {
		root: {
		// backgroundColor: 'white',
		},
	},
	},
	MuiPaper: {
	styleOverrides: {
		root: {
		// backgroundColor: '#e0e0e0',
		boxShadow: '0px 0px 0px 0px',
		},
	},
	},
}
});

lightTheme = responsiveFontSizes(lightTheme, { breakpoints: ['xs', 'sm', 'md', 'lg', 'xl',], factor: 100 });



function MyApp() {
	const [activeNetwork, setActiveNetwork, dropActiveNetwork] = useLocalStorage('activeNetwork', 'devnet' as keyof typeof NETWORK_CONFIG);
	const [settings, setSettings, removeSettings] = useLocalStorage('settings', getDefaultSettings());

	return (
		<SuiClientProvider
			networks={NETWORK_CONFIG}
			network={activeNetwork}
			onNetworkChange={(network) => {
				setActiveNetwork(network);
			}}
			createClient={(network, config) => {
				const url = network === 'localnet' ? 'http://localhost:9005' : (network === 'devnet' ? getFullnodeUrl(network)  : getFullnodeUrl(network));
				return new SuiClient({
					transport: new SuiHTTPTransport({
					  url: url,
					  // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
					  // WebSocketConstructor: WebSocket as never,
					  WebSocketConstructor: window.WebSocket,
					}),
				  });
			}}
		>
		<WalletProvider autoConnect={true} theme={dappDefaultTheme}
		>
			<App settings={settings!} setSettings={setSettings} />
		</WalletProvider>
		</SuiClientProvider>
	);
}


const SnackbarCloseButton =({ snackbarKey } : { snackbarKey: SnackbarKey }) => {
	const { closeSnackbar } = useSnackbar();
  
	return (
	  <IconButton onClick={() => closeSnackbar(snackbarKey)}>
		<CloseIcon />
	  </IconButton>
	);
  }

export const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<BrowserRouter>
		<QueryClientProvider client={queryClient}>
			<SnackbarProvider dense maxSnack={3} anchorOrigin={{ horizontal: 'right', vertical: 'top' }} autoHideDuration={2500}
			action={snackbarKey => <SnackbarCloseButton snackbarKey={snackbarKey} />}
			>
				<MyApp />
			</SnackbarProvider>
		</QueryClientProvider>
	</BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
