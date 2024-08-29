import { hashData, chunkData, Chunk } from '../../utils';
import { storeData, retrieveData, storeTransactionResult } from '../../api';
import { createTransactionManager, TransactionResult } from '../transactionManager';
import { isJson } from '../../utils';
import dotenv from 'dotenv';

dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'ws://localhost:9944';
const KEYPAIR_URI = process.env.KEYPAIR_URI || '//Alice';

export type Metadata = {
    dataCid: string;
    filename?: string;
    mimeType?: string;
    totalSize: number;
    totalChunks: number;
    chunks: Array<{
        cid: string;
        order: number;
        size: number;
    }>;
};

const storeMetadata = async (metadata: Metadata): Promise<string> => {
    const metadataString = JSON.stringify(metadata);
    return await storeData(`metadata:${metadata.dataCid}`, metadataString);
};

const storeChunks = async (chunks: Chunk[]): Promise<void> => {
    await Promise.all(chunks.map(chunk => storeData(chunk.cid, chunk.data.toString('base64'))));
};

export const processData = async (
    data: Buffer,
    filename?: string,
    mimeType?: string
): Promise<{ cid: string; transactionResults: TransactionResult[] }> => {
    const chunks = chunkData(data);
    const dataCid = hashData(data);

    const metadata: Metadata = {
        dataCid,
        filename,
        mimeType,
        totalSize: data.length,
        totalChunks: chunks.length,
        chunks: chunks,
    };

    const metadataString = JSON.stringify(metadata);

    const transactionManager = createTransactionManager(RPC_ENDPOINT!, KEYPAIR_URI!);
    const transactions = [
        {
            module: 'system',
            method: 'remarkWithEvent',
            params: [metadataString],
        },
        ...chunks.map(chunk => ({
            module: 'system',
            method: 'remarkWithEvent',
            params: [chunk.data.toString('base64')],
        })),
    ];

    const results = await transactionManager.submit(transactions);

    await storeMetadata(metadata);
    await storeChunks(chunks);

    await storeTransactionResult(dataCid, JSON.stringify(results));

    return { cid: dataCid, transactionResults: results };
};

export const retrieveAndReassembleData = async (metadataCid: string): Promise<Buffer> => {
    const metadataString = await retrieveData(metadataCid);
    if (!metadataString || !isJson(metadataString)) {
        throw new Error('Metadata not found');
    }

    const metadata: Metadata = JSON.parse(metadataString);

    if (metadata.totalChunks === 1) {
        const data = await retrieveData(metadata.chunks[0].cid);
        if (!data) {
            throw new Error(`Data with CID ${metadata.chunks[0].cid} not found`);
        }
        console.log('data', data);
        return Buffer.from(data, 'base64');
    }

    // Ensure the chunks are sorted by order
    const sortedChunks = metadata.chunks.sort((a, b) => a.order - b.order);

    const chunks: Buffer[] = await Promise.all(
        sortedChunks.map(async chunk => {
            const chunkData = await retrieveData(chunk.cid);
            if (!chunkData) {
                throw new Error(`Chunk with CID ${chunk.cid} not found`);
            }
            return Buffer.from(chunkData, 'base64');
        })
    );

    return Buffer.concat(chunks);
};
