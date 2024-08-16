import { createKeyValueStore } from '../keyValueStore';

export const storeData = async (data: string): Promise<string> => {
    const keyValueStore = await createKeyValueStore();
    return await keyValueStore.setData(data);
};

export const retrieveData = async (hash: string): Promise<string | undefined> => {
    const keyValueStore = await createKeyValueStore();
    return await keyValueStore.getData(hash);
};
