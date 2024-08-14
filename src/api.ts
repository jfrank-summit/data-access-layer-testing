import { hashData } from './dataHasher';
import { Store, setData, getData } from './keyValueStore';

export const storeData = (store: Store, data: string): [Store, string] => {
    const hash = hashData(data);
    const newStore = setData(store, hash, data);
    return [newStore, hash];
};

export const retrieveData = (store: Store, hash: string): string | undefined => getData(store, hash);
