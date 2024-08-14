import { createExtrinsicListener } from './extrinsicListener';
import { initialize, setData, getAllData } from './keyValueStore';
import { storeData, retrieveData } from './api';

const main = async () => {
    await initialize();

    const listenForRemarks = createExtrinsicListener('wss://rpc.devnet.subspace.network/ws');

    const displayAllData = async () => {
        const allData = await getAllData();
        console.log('All data in the database:');
        allData.forEach(({ key, value }) => {
            console.log(`Hash: ${key}, Value: ${value}`);
        });
    };

    await listenForRemarks(async data => {
        const hash = await storeData(data);
        console.log(`Stored data with hash: ${hash}`);
        displayAllData();
    });

    await displayAllData();
};

main().catch(console.error);
