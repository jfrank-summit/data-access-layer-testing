import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

export const initAutonomysApi = async (rpcEndpoint: string, keypairUri: string) => {
    await cryptoWaitReady();
    const wsProvider = new WsProvider(rpcEndpoint);
    const api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: 'sr25519' });
    const account = keyring.addFromUri(keypairUri);
    return { api, account };
};
