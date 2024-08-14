import { createExtrinsicListener } from './extrinsicListener';
import { storeData, retrieveData } from './api';
import { createStore } from './keyValueStore';

const main = async () => {
    let store = createStore();

    const listenForRemarks = createExtrinsicListener('wss://rpc.devnet.subspace.network/ws');

    await listenForRemarks(data => {
        const [newStore, hash] = storeData(store, data);
        store = newStore;
        console.log(`Stored data with hash: ${hash}`);
    });

    // Example of storing and retrieving data
    // const testData = 'Test data';
    // const [updatedStore, testHash] = storeData(store, testData);
    // store = updatedStore;

    // const retrievedData = retrieveData(store, testHash);
    // console.log(`Retrieved data: ${retrievedData}`);
};

main().catch(console.error);
