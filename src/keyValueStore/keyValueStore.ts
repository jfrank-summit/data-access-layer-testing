import { initDatabase } from '../database';
import { hashData } from '../utils';

export const createKeyValueStore = async () => {
    const dbOps = await initDatabase();

    const setData = async (data: string): Promise<string> => {
        const hash = hashData(data);
        await dbOps.setData(hash, data);
        return hash;
    };

    const getData = async (hash: string): Promise<string | undefined> => {
        return await dbOps.getData(hash);
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
