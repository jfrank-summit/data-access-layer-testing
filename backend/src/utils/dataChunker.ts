import { hashData } from './dataHasher';

const MAX_CHUNK_SIZE = 1024 * 64; // 64 KB

export type Chunk = {
    cid: string;
    order: number;
    size: number;
    data: Buffer;
};

export const chunkData = (data: Buffer): Chunk[] =>
    Array.from({ length: Math.ceil(data.length / MAX_CHUNK_SIZE) }, (_, i) => {
        const start = i * MAX_CHUNK_SIZE;
        const end = Math.min((i + 1) * MAX_CHUNK_SIZE, data.length);
        const chunkData = data.slice(start, end);
        return {
            cid: hashData(chunkData),
            order: i,
            size: chunkData.length,
            data: chunkData,
        };
    });
