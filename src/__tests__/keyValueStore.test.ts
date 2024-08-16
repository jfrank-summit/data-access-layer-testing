import { initialize, setData, getData, getAllData } from '../keyValueStore/keyValueStore';
import { hashData } from '../utils/dataHasher';

jest.mock('../database', () => ({
    initDatabase: jest.fn().mockResolvedValue({
        setData: jest.fn(),
        getData: jest.fn(),
        getAllData: jest.fn(),
    }),
}));

describe('keyValueStore', () => {
    let mockDatabase: any;

    beforeEach(async () => {
        mockDatabase = await require('../database').initDatabase();
        await initialize();
    });

    it('should set and get data correctly', async () => {
        const testData = 'test data';
        const hash = await setData(testData);
        expect(hash).toBe(hashData(testData));

        mockDatabase.getData.mockResolvedValueOnce(testData);

        const retrievedData = await getData(hash);
        expect(retrievedData).toBe(testData);
    });

    it('should return all data correctly', async () => {
        const mockAllData = [
            { key: 'hash1', value: 'data1' },
            { key: 'hash2', value: 'data2' },
        ];

        mockDatabase.getAllData.mockResolvedValueOnce(mockAllData);

        const allData = await getAllData();
        expect(allData).toEqual(mockAllData);
    });
});
