import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { processData, retrieveAndReassembleData, Metadata } from './services/storageManager';
import { retrieveData, getAllData, getAllMetadata, retrieveTransactionResult, getAllTransactionResults } from './api';
import { TransactionResult, createApi, retrieveRemarkFromTransaction } from './services/transactionManager';
import { isJson } from './utils';

import dotenv from 'dotenv';
dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'ws://localhost:9944';

const setContentTypeHeaders = (res: express.Response, metadata: Metadata) => {
    res.set('Content-Type', metadata.mimeType || 'application/octet-stream');
    if (metadata.filename) {
        console.log(`Setting Content-Disposition to attachment with filename: ${metadata.filename}`);
        res.set('Content-Disposition', `attachment; filename="${metadata.filename}"`);
    }
};

const createServer = async () => {
    const app = express();
    const port = 3000;

    // Increase the limit to 10MB (adjust as needed)
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
    app.use(cors());

    app.post('/submit', async (req, res) => {
        try {
            const { data, filename, mimeType } = req.body;
            if (!data) {
                return res.status(400).json({ error: 'Data is required' });
            }

            const buffer = Buffer.from(data, 'base64');
            const result = await processData(buffer, filename, mimeType);

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
            const metadata: Metadata = JSON.parse(metadataString);

            console.log(`Attempting to retrieve data for metadataCid: ${cid}`);
            const data = await retrieveAndReassembleData(metadataCid);

            setContentTypeHeaders(res, metadata);
            res.send(data);
        } catch (error: any) {
            console.error('Error retrieving data:', error);
            res.status(500).json({ error: 'Failed to retrieve data', details: error.message });
        }
    });

    app.get('/metadata/:cid', async (req, res) => {
        try {
            const { cid } = req.params;
            const metadataString = await retrieveData(`metadata:${cid}`);
            if (!metadataString) {
                return res.status(404).json({ error: 'Metadata not found' });
            }
            const metadata: Metadata = JSON.parse(metadataString);
            res.json(metadata);
        } catch (error: any) {
            console.error('Error retrieving metadata:', error);
            res.status(500).json({ error: 'Failed to retrieve metadata', details: error.message });
        }
    });

    app.get('/allMetadata', async (req, res) => {
        try {
            const allMetadata = await getAllMetadata();
            const formattedMetadata = allMetadata.map(({ value }) => JSON.parse(value));
            console.log('downloaded formattedMetadata', formattedMetadata);
            res.json(formattedMetadata);
        } catch (error) {
            console.error('Error retrieving all metadata:', error);
            res.status(500).json({ error: 'Failed to retrieve all metadata' });
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

    app.get('/fromTransactions/:cid', async (req, res) => {
        try {
            const { cid } = req.params;
            const transactionResultsString = await retrieveTransactionResult(cid);

            if (!transactionResultsString) {
                return res.status(404).json({ error: 'Transaction result not found' });
            }

            const transactionResults: TransactionResult[] = JSON.parse(transactionResultsString);

            const api = await createApi(RPC_ENDPOINT);
            const remarks = await Promise.all(
                transactionResults.map(result => retrieveRemarkFromTransaction(api, result))
            );

            if (remarks.some(remark => remark === null)) {
                return res.status(404).json({ error: 'Remarks not found or invalid transaction' });
            }

            if (!remarks[0] || !isJson(remarks[0])) {
                return res.status(400).json({ error: 'Invalid metadata format' });
            }

            const metadata: Metadata = JSON.parse(remarks[0]);

            const data = remarks.slice(1).map(remark => Buffer.from(remark!, 'base64'));
            setContentTypeHeaders(res, metadata);
            res.send(Buffer.concat(data));
        } catch (error: any) {
            console.error('Error retrieving remark:', error);
            res.status(500).json({ error: 'Failed to retrieve remark', details: error.message });
        }
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

createServer().catch(console.error);
