import { getFullnodeUrl } from '@mysten/sui.js/client';

import { SuiType } from './SuiType';

export const ADMIN_ADDRESS = '0x70cba2254a6c73a68e2ad3f079e7f14c4233d5dfb4dc0f3c519321c843903cab';
const LOCALNET_PACKAGE_ID = '0x123';
const MAINNET_PACKAGE_ID = '0x456';
const DEVNET_PACKAGE_ID = '0x11816c1b1672c8d1c775fd9ce1a1a70ff066fa8fb68882e74e562308bdf29ebc';

const formatLink = (key: string, suiType: SuiType, network: string) => {
	if (network === 'localnet') {
		return null;
	}
	const useSuiType = (suiType === SuiType.txblock) ? 'tx' : suiType;
	return `https://suiscan.xyz/${network}/${useSuiType}/${key}`;
}


export const NETWORK_CONFIG = {
	localnet: {
		url: 'http://127.0.0.1:9005',
		variables: {
			myMovePackageId: LOCALNET_PACKAGE_ID,
			network: 'localnet',
			formatLink: (key: string, suiType: SuiType) => {
				return formatLink(key, suiType, 'localnet')
			}
		}
	},
	mainnet: {
		url: getFullnodeUrl('mainnet'),
		variables: {
			myMovePackageId: MAINNET_PACKAGE_ID,
			network: 'mainnet',
			formatLink: (key: string, suiType: SuiType) => {
				return formatLink(key, suiType, 'mainnet')
			}
		}
	},
	devnet: {
		url: getFullnodeUrl('devnet'),
		variables: {
			myMovePackageId: DEVNET_PACKAGE_ID,
			network: 'devnet',
			formatLink: (key: string, suiType: SuiType) => {
				return formatLink(key, suiType, 'devnet');
			}
		}
	},
};


export const WASM_PATHS = {
    pubKey: '/pubkey.wasm',
    add: '/add.wasm',
    encryptShuffle: '/encrypt_shuffle.wasm',
    zeroEncrypt: '/zero_encrypt.wasm',
    decrypt: '/decrypt.wasm',
    reveal: '/reveal2.wasm',
}

export const ZKEYS = {
    pubKeyZkey: '/pubkey_0001.zkey',
    addZkey: '/add_0001.zkey',
    // encryptShuffleZkey: '/encrypt_shuffle_0001.zkey',
    // zeroEncryptZkey: '/zero_encrypt_0001.zkey',
    decryptZkey: '/decrypt_0001.zkey',
    revealZkey: '/reveal2_0001.zkey',
}
