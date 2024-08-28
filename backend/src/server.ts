import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { processData, retrieveAndReassembleData } from './services/storageManager';
import { retrieveData, getAllData, retrieveTransactionResult, getAllTransactionResults } from './api';

const createServer = async () => {
    const app = express();
    const port = 3000;

    // Increase the limit to 10MB (adjust as needed)
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
    app.use(cors());

    app.post('/submit', async (req, res) => {
        try {
            const { data, name, mimeType } = req.body;
            if (!data) {
                return res.status(400).json({ error: 'Data is required' });
            }

            const buffer = Buffer.from(data, 'base64');
            const result = await processData(buffer, name, mimeType);

            res.json({ result });
        } catch (error) {
            console.error('Error processing data:', error);
            res.status(500).json({ error: 'Failed to process and submit data' });
        }
    });

    app.get('/retrieve/:cid', async (req, res) => {
        try {
            const { cid } = req.params;
            const metadataCid = `metadata:${cid}`;

            const metadataString = await retrieveData(metadataCid);
            if (!metadataString) {
                return res.status(404).json({ error: 'Metadata not found' });
            }
            const metadata = JSON.parse(metadataString);

            console.log(`Attempting to retrieve data for metadataCid: ${cid}`);
            const data = await retrieveAndReassembleData(metadataCid);

            res.set('Content-Type', metadata.mimeType || 'application/octet-stream');
            if (metadata.filename) {
                console.log(`Setting Content-Disposition to attachment with filename: ${metadata.filename}`);
                res.set('Content-Disposition', `attachment; filename="${metadata.name}"`);
            }
            res.send(data);
        } catch (error: any) {
            console.error('Error retrieving data:', error);
            res.status(500).json({ error: 'Failed to retrieve data', details: error.message });
        }
    });

    app.get('/all', async (req, res) => {
        try {
            const allData = await getAllData();
            const formattedData = allData.map(({ key, value }) => ({
                key,
                value: value.length > 500 ? value.substring(0, 500) + '...' : value,
            }));
            res.json(formattedData);
        } catch (error) {
            console.error('Error retrieving all data:', error);
            res.status(500).json({ error: 'Failed to retrieve all data' });
        }
    });

    app.get('/transaction/:cid', async (req, res) => {
        try {
            const { cid } = req.params;
            const transactionResult = await retrieveTransactionResult(cid);
            if (!transactionResult) {
                return res.status(404).json({ error: 'Transaction result not found' });
            }
            res.json(JSON.parse(transactionResult));
        } catch (error: any) {
            console.error('Error retrieving transaction result:', error);
            res.status(500).json({ error: 'Failed to retrieve transaction result', details: error.message });
        }
    });

    app.get('/transactions', async (req, res) => {
        try {
            const allTransactionResults = await getAllTransactionResults();
            const formattedResults = allTransactionResults.map(({ key, value }) => ({
                key,
                value: JSON.parse(value),
            }));
            res.json(formattedResults);
        } catch (error: any) {
            console.error('Error retrieving all transaction results:', error);
            res.status(500).json({ error: 'Failed to retrieve all transaction results', details: error.message });
        }
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

createServer().catch(console.error);
