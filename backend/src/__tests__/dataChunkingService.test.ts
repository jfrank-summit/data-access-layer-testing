import { processData, retrieveAndReassembleData } from '../services/storageManager';
import { storeData, retrieveData } from '../api';

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
    retrieveData: jest.fn(),
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

    describe('retrieveAndReassembleData', () => {
        it('should retrieve and reassemble small data correctly', async () => {
            const originalData = 'Small data';
            const metadata = {
                dataCid: 'mock-cid-small',
                dataType: 'raw',
                totalSize: originalData.length,
                totalChunks: 1,
                chunks: [{ cid: 'mock-cid-small-chunk', order: 0, size: originalData.length }],
            };

            (retrieveData as jest.Mock).mockImplementation((cid: string) => {
                if (cid === 'mock-cid-small') {
                    return Promise.resolve(JSON.stringify(metadata));
                } else if (cid === 'mock-cid-small-chunk') {
                    return Promise.resolve(Buffer.from(originalData).toString('base64'));
                }
            });

            const result = await retrieveAndReassembleData('mock-cid-small');
            expect(result.toString()).toBe(originalData);
        });

        it('should retrieve and reassemble large chunked data correctly', async () => {
            const chunk1 = 'Chunk 1 data';
            const chunk2 = 'Chunk 2 data';
            const chunk3 = 'Chunk 3 data';
            const originalData = chunk1 + chunk2 + chunk3;

            const metadata = {
                dataCid: 'mock-cid-large',
                dataType: 'raw',
                totalSize: originalData.length,
                totalChunks: 3,
                chunks: [
                    { cid: 'mock-cid-chunk1', order: 0, size: chunk1.length },
                    { cid: 'mock-cid-chunk2', order: 1, size: chunk2.length },
                    { cid: 'mock-cid-chunk3', order: 2, size: chunk3.length },
                ],
            };

            (retrieveData as jest.Mock).mockImplementation((cid: string) => {
                switch (cid) {
                    case 'mock-cid-large':
                        return Promise.resolve(JSON.stringify(metadata));
                    case 'mock-cid-chunk1':
                        return Promise.resolve(Buffer.from(chunk1).toString('base64'));
                    case 'mock-cid-chunk2':
                        return Promise.resolve(Buffer.from(chunk2).toString('base64'));
                    case 'mock-cid-chunk3':
                        return Promise.resolve(Buffer.from(chunk3).toString('base64'));
                    default:
                        return Promise.resolve(null);
                }
            });

            const result = await retrieveAndReassembleData('mock-cid-large');
            expect(result.toString()).toBe(originalData);
        });

        it('should throw an error if metadata is not found', async () => {
            (retrieveData as jest.Mock).mockResolvedValue(null);

            await expect(retrieveAndReassembleData('non-existent-cid')).rejects.toThrow('Metadata not found');
        });

        it('should throw an error if a chunk is not found', async () => {
            const metadata = {
                dataCid: 'mock-cid-missing-chunk',
                dataType: 'raw',
                totalSize: 10,
                totalChunks: 2,
                chunks: [
                    { cid: 'mock-cid-chunk1', order: 0, size: 5 },
                    { cid: 'mock-cid-chunk2', order: 1, size: 5 },
                ],
            };

            (retrieveData as jest.Mock).mockImplementation((cid: string) => {
                if (cid === 'mock-cid-missing-chunk') {
                    return Promise.resolve(JSON.stringify(metadata));
                } else if (cid === 'mock-cid-chunk1') {
                    return Promise.resolve(Buffer.from('Chunk').toString('base64'));
                } else {
                    return Promise.resolve(null);
                }
            });

            await expect(retrieveAndReassembleData('mock-cid-missing-chunk')).rejects.toThrow(
                'Chunk with CID mock-cid-chunk2 not found'
            );
        });
    });
});
