import { createKeyValueStore } from '../keyValueStore';
import { hashData } from '../utils/dataHasher';

jest.mock('../database', () => ({
    initDatabase: jest.fn().mockResolvedValue({
        setData: jest.fn(),
        getData: jest.fn(),
        getAllData: jest.fn(),
    }),
}));

describe('keyValueStore', () => {
    let keyValueStore: Awaited<ReturnType<typeof createKeyValueStore>>;
    let mockDatabase: any;

    beforeEach(async () => {
        mockDatabase = await require('../database').initDatabase();
        keyValueStore = await createKeyValueStore();
    });

    it('should set and get data correctly', async () => {
        const testData = 'test data';
        const cid = hashData(testData);
        const hash = await keyValueStore.setData(cid, testData);
        expect(hash).toBe(hashData(testData));

        mockDatabase.getData.mockResolvedValueOnce(testData);

        const retrievedData = await keyValueStore.getData(hash);
        expect(retrievedData).toBe(testData);
    });

    it('should return all data correctly', async () => {
        const mockAllData = [
            { key: 'hash1', value: 'data1' },
            { key: 'hash2', value: 'data2' },
        ];

        mockDatabase.getAllData.mockResolvedValueOnce(mockAllData);

        const allData = await keyValueStore.getAllData();
        expect(allData).toEqual(mockAllData);
    });
});
