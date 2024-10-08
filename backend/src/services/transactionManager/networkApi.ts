import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

export const createApi = async (endpoint: string): Promise<ApiPromise> => {
    const provider = new WsProvider(endpoint);
    console.log('connecting to: ', endpoint);
    return await ApiPromise.create({ provider });
};

export const createKeyPair = (uri: string): KeyringPair => {
    const keyring = new Keyring({ type: 'sr25519' });
    return keyring.addFromUri(uri);
};

export const getAccountNonce = async (api: ApiPromise, address: string): Promise<number> => {
    const nonce = await api.rpc.system.accountNextIndex(address);
    return nonce.toNumber();
};
