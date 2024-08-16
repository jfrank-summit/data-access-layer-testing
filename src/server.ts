import dotenv from 'dotenv';
dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT!;
const KEYPAIR_URI = process.env.KEYPAIR_URI!;

import express from 'express';
import bodyParser from 'body-parser';
import { createKeyValueStore } from './keyValueStore';
import { initAutonomysApi } from './blockchain';

const createServer = async () => {
    const app = express();
    const port = 3000;

    app.use(bodyParser.json());

    const keyValueStore = await createKeyValueStore();
    const { api, account } = await initAutonomysApi(RPC_ENDPOINT, KEYPAIR_URI);

    app.post('/submit', async (req, res) => {
        try {
            const { data } = req.body;
            if (!data) {
                return res.status(400).json({ error: 'Data is required' });
            }
            await api.tx.system.remarkWithEvent(data).signAndSend(account);
            const hash = await keyValueStore.setData(data);
            res.json({ hash });
        } catch (error) {
            res.status(500).json({ error: 'Failed to submit data' });
        }
    });

    app.get('/retrieve/:hash', async (req, res) => {
        try {
            const { hash } = req.params;
            const data = await keyValueStore.getData(hash);
            if (data) {
                res.json({ data });
            } else {
                res.status(404).json({ error: 'Data not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve data' });
        }
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

createServer().catch(console.error);
