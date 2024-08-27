import { initDatabase } from '../database';

export const createKeyValueStore = async () => {
    const dbOps = await initDatabase();

    const setData = async (key: string, data: string): Promise<string> => {
        await dbOps.setData(key, data);
        return key;
    };

    const getData = async (key: string): Promise<string | undefined> => {
        return await dbOps.getData(key);
    };

    const getAllData = async (): Promise<Array<{ key: string; value: string }>> => {
        return await dbOps.getAllData();
    };

    return {
        setData,
        getData,
        getAllData,
    };
};
