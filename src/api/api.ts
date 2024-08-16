import { createKeyValueStore } from '../keyValueStore';

export const storeData = async (key: string, data: string): Promise<string> => {
    const keyValueStore = await createKeyValueStore();
    return await keyValueStore.setData(key, data);
};

export const retrieveData = async (key: string): Promise<string | undefined> => {
    const keyValueStore = await createKeyValueStore();
    return await keyValueStore.getData(key);
};
