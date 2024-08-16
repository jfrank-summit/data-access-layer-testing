import { initDatabase } from '../database/database';
import { hashData } from '../utils/dataHasher';

let dbOps: {
    setData: (key: string, value: string) => Promise<void>;
    getData: (key: string) => Promise<string | undefined>;
    getAllData: () => Promise<Array<{ key: string; value: string }>>;
};

export const initialize = async () => {
    dbOps = await initDatabase();
};

export const setData = async (data: string): Promise<string> => {
    if (!dbOps) throw new Error('Database not initialized');
    const hash = hashData(data);
    await dbOps.setData(hash, data);
    return hash;
};

export const getData = async (hash: string): Promise<string | undefined> => {
    if (!dbOps) throw new Error('Database not initialized');
    return await dbOps.getData(hash);
};

export const getAllData = async (): Promise<Array<{ key: string; value: string }>> => {
    if (!dbOps) throw new Error('Database not initialized');
    return await dbOps.getAllData();
};
