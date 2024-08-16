import dotenv from 'dotenv';
dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT!;
const KEYPAIR_URI = process.env.KEYPAIR_URI!;

import express from 'express';
import bodyParser from 'body-parser';
import { processData } from './services/dataChunking';
import { retrieveData } from './api';

const createServer = async () => {
    const app = express();
    const port = 3000;

    // Increase the limit to 10MB (adjust as needed)
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

    app.post('/submit', async (req, res) => {
        try {
            const { data, dataType, name, mimeType, customMetadata } = req.body;
            if (!data) {
                return res.status(400).json({ error: 'Data is required' });
            }

            const buffer = Buffer.from(data);
            const metadataCid = await processData(buffer, dataType || 'raw', name, mimeType, customMetadata);

            res.json({ metadataCid });
        } catch (error) {
            console.error('Error processing data:', error);
            res.status(500).json({ error: 'Failed to process and submit data' });
        }
    });

    app.get('/retrieve/:cid', async (req, res) => {
        try {
            const { cid } = req.params;
            console.log(`Attempting to retrieve data for metadataCid: ${cid}`);
            const rawData = await retrieveData(cid);
            if (rawData) {
                try {
                    //TODO: parse the data if json or handle metadata differently
                    res.json({ data: rawData });
                } catch (parseError: any) {
                    console.error('Error parsing metadata:', parseError);
                    res.status(500).json({ error: 'Failed to parse metadata', details: parseError.message });
                }
            } else {
                console.log(`No metadata found for metadataCid: ${cid}`);
                res.status(404).json({ error: 'Metadata not found' });
            }
        } catch (error: any) {
            console.error('Error retrieving data:', error);
            res.status(500).json({ error: 'Failed to retrieve data', details: error.message });
        }
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

createServer().catch(console.error);
