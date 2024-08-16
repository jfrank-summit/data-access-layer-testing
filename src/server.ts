import dotenv from 'dotenv';
dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT!;
const KEYPAIR_URI = process.env.KEYPAIR_URI!;

import express from 'express';
import bodyParser from 'body-parser';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { initialize, getData } from './keyValueStore/keyValueStore';
import { storeData } from './api/api';

const app = express();
const port = 3000;

app.use(bodyParser.json());

let api: ApiPromise;
let account: any;

const initPolkadot = async () => {
    await cryptoWaitReady();
    const wsProvider = new WsProvider(RPC_ENDPOINT);
    api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: 'sr25519' });
    account = keyring.addFromUri(KEYPAIR_URI);
};

app.post('/submit', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ error: 'Data is required' });
        }

        await api.tx.system.remarkWithEvent(data).signAndSend(account);
        const hash = await storeData(data);
        res.json({ hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit data' });
    }
});

app.get('/retrieve/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const data = await getData(hash);
        if (data) {
            res.json({ data });
        } else {
            res.status(404).json({ error: 'Data not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

const startServer = async () => {
    await initialize();
    await initPolkadot();
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

startServer().catch(console.error);
