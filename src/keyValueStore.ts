export type Store = ReadonlyMap<string, string>;

export const createStore = (): Store => new Map();

export const setData = (store: Store, key: string, value: string): Store => new Map(store).set(key, value);

export const getData = (store: Store, key: string): string | undefined => store.get(key);
