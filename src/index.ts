import { createExtrinsicListener } from './extrinsicListener';
import { initialize, getAllData } from './keyValueStore';
import { storeData } from './api';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const generateRandomData = (length: number): string => {
    return Array.from({ length }, () =>
        Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
    ).join('');
};

const submitRandomRemark = async (api: ApiPromise, account: any) => {
    const randomData = generateRandomData(32); // Generate 32 bytes of random data
    console.log(`Submitting remark with data: ${randomData}`);
    await api.tx.system.remarkWithEvent(randomData).signAndSend(account);
};

const main = async () => {
    await initialize();
    await cryptoWaitReady();

    const wsProvider = new WsProvider('wss://rpc.devnet.subspace.network/ws');
    const api = await ApiPromise.create({ provider: wsProvider });

    const keyring = new Keyring({ type: 'sr25519' });
    const account = keyring.addFromUri('//Alice'); // Use a test account. Replace with your actual account in production.

    const listenForRemarks = createExtrinsicListener('wss://rpc.devnet.subspace.network/ws');

    const displayAllData = async () => {
        const allData = await getAllData();
        console.log('All data in the database:');
        allData.forEach(({ key, value }) => {
            const truncatedValue = value.slice(0, 40) + (value.length > 40 ? '...' : '');
            console.log(`Hash: ${key}, Value: ${truncatedValue}`);
        });
    };

    await listenForRemarks(async data => {
        const hash = await storeData(data);
        console.log(`Stored data with hash: ${hash}`);
        await displayAllData();
    });

    // Submit a random remark every 20 seconds
    setInterval(() => submitRandomRemark(api, account), 20000);

    await displayAllData();
};

main().catch(console.error);
