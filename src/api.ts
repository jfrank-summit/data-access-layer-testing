import { setData, getData } from './keyValueStore';

export const storeData = async (data: string): Promise<string> => {
    return await setData(data);
};

export const retrieveData = async (hash: string): Promise<string | undefined> => {
    return await getData(hash);
};
