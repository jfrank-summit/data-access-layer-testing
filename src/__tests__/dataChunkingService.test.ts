import { processData } from '../services/dataChunking';
import { storeData } from '../api';

// Mock the storeData function
jest.mock('../api', () => ({
    storeData: jest.fn().mockImplementation((key: string, data: string | Buffer) => {
        if (typeof data === 'string') {
            try {
                JSON.parse(data);
                return Promise.resolve(data); // Return the JSON string directly
            } catch (e) {
                // Not a valid JSON string, continue to return mock CID
            }
        }
        // For Buffer or non-JSON string, return a mock CID
        return Promise.resolve(`mock-cid-${typeof data === 'string' ? data.length : data.byteLength}`);
    }),
}));

describe('dataChunkingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should process small data without chunking', async () => {
        const data = Buffer.from('Small data');
        const result = await processData(data, 'raw');

        expect(storeData).toHaveBeenCalledTimes(2); // Once for data, once for metadata
        expect(typeof result).toBe('string');
        const metadata = JSON.parse(result);
        expect(metadata).toHaveProperty('dataCid');
        expect(metadata).toHaveProperty('dataType', 'raw');
        expect(metadata).toHaveProperty('totalSize', 10);
        expect(metadata).toHaveProperty('totalChunks', 1);
    });

    it('should process and chunk large data', async () => {
        const data = Buffer.alloc(1024 * 64 * 2.5); // 2.5 chunks
        data.fill('A');
        const result = await processData(data, 'raw');

        expect(storeData).toHaveBeenCalledTimes(4); // 3 chunks + 1 metadata
        expect(typeof result).toBe('string');
        const metadata = JSON.parse(result);
        expect(metadata).toHaveProperty('dataCid');
        expect(metadata).toHaveProperty('dataType', 'raw');
        expect(metadata).toHaveProperty('totalSize', 163840);
        expect(metadata).toHaveProperty('totalChunks', 3);
        expect(metadata.chunks).toHaveLength(3);
    });

    it('should include file metadata when processing a file', async () => {
        const data = Buffer.from('File content');
        const result = await processData(data, 'file', 'test.txt', 'text/plain');

        expect(storeData).toHaveBeenCalledTimes(2);
        const metadata = JSON.parse(result);
        expect(metadata.name).toBe('test.txt');
        expect(metadata.mimeType).toBe('text/plain');
        expect(metadata.dataType).toBe('file');
    });

    it('should handle custom metadata', async () => {
        const data = Buffer.from('Data with custom metadata');
        const customMetadata = { key1: 'value1', key2: 'value2' };
        const result = await processData(data, 'raw', undefined, undefined, customMetadata);

        expect(storeData).toHaveBeenCalledTimes(2);
        const metadata = JSON.parse(result);
        expect(metadata.customMetadata).toEqual(customMetadata);
        expect(metadata.dataType).toBe('raw');
    });
});
