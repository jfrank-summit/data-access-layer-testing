import { createHash } from 'crypto';
import { storeData, retrieveData } from '../../api';

const MAX_CHUNK_SIZE = 1024 * 64; // 64 KB

type Chunk = {
    cid: string;
    order: number;
    size: number;
    data: Buffer;
};

type Metadata = {
    dataCid: string;
    dataType: 'file' | 'raw';
    name?: string;
    mimeType?: string;
    totalSize: number;
    totalChunks: number;
    chunks: Array<{
        cid: string;
        order: number;
        size: number;
        dsnLocation?: {
            pieceIndex: number;
            offset: number;
        };
    }>;
    customMetadata?: Record<string, any>;
};

const generateCid = (data: Buffer): string => createHash('sha256').update(data).digest('hex');

const chunkData = (data: Buffer): Chunk[] =>
    Array.from({ length: Math.ceil(data.length / MAX_CHUNK_SIZE) }, (_, i) => {
        const start = i * MAX_CHUNK_SIZE;
        const end = Math.min((i + 1) * MAX_CHUNK_SIZE, data.length);
        const chunkData = data.slice(start, end);
        return {
            cid: generateCid(chunkData),
            order: i,
            size: chunkData.length,
            data: chunkData,
        };
    });

const storeMetadata = async (metadata: Metadata): Promise<string> => {
    const metadataString = JSON.stringify(metadata);
    return await storeData(metadata.dataCid, metadataString);
};

const storeChunks = async (chunks: Chunk[]): Promise<void> => {
    await Promise.all(chunks.map(chunk => storeData(chunk.cid, chunk.data.toString('base64'))));
};

export const processData = async (
    data: Buffer,
    dataType: 'file' | 'raw',
    name?: string,
    mimeType?: string,
    customMetadata?: Record<string, any>
): Promise<string> => {
    const chunks = chunkData(data);
    const dataCid = generateCid(data);

    const metadata: Metadata = {
        dataCid,
        dataType,
        name,
        mimeType,
        totalSize: data.length,
        totalChunks: chunks.length,
        chunks: chunks.map(({ cid, order, size }) => ({ cid, order, size })),
        customMetadata,
    };

    await storeChunks(chunks);
    return await storeMetadata(metadata);
};

export const retrieveAndReassembleData = async (metadataCid: string): Promise<Buffer> => {
    const metadataString = await retrieveData(metadataCid);
    if (!metadataString) {
        throw new Error('Metadata not found');
    }

    const metadata: Metadata = JSON.parse(metadataString);
    const chunks: Buffer[] = await Promise.all(
        metadata.chunks.map(async chunk => {
            const chunkData = await retrieveData(chunk.cid);
            if (!chunkData) {
                throw new Error(`Chunk with CID ${chunk.cid} not found`);
            }
            return Buffer.from(chunkData, 'base64');
        })
    );

    const sortedChunks = chunks.sort(
        (a, b) =>
            metadata.chunks.findIndex(c => c.cid === generateCid(a)) -
            metadata.chunks.findIndex(c => c.cid === generateCid(b))
    );

    return Buffer.concat(sortedChunks);
};
