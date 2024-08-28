import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { SubmittableResultValue } from '@polkadot/api/types';

type Transaction = {
    module: string;
    method: string;
    params: any[];
};

export type TransactionResult = {
    success: boolean;
    hash: string;
    blockHash?: string;
    status: string;
    error?: string;
};

const MAX_BATCH_SIZE = 1024 * 1024; // 1 MiB

const createApi = async (endpoint: string): Promise<ApiPromise> => {
    const provider = new WsProvider(endpoint);
    return await ApiPromise.create({ provider });
};

const createKeyPair = (uri: string): KeyringPair => {
    const keyring = new Keyring({ type: 'sr25519' });
    return keyring.addFromUri(uri);
};

const submitBatchTransaction = async (
    api: ApiPromise,
    keyPair: KeyringPair,
    transactions: Transaction[],
    nonce: number
): Promise<TransactionResult[]> => {
    return new Promise((resolve, reject) => {
        const txs = transactions.map(tx => api.tx[tx.module][tx.method](...tx.params));
        const batchTx = api.tx.utility.batchAll(txs);

        let unsubscribe: () => void;

        const timeout = setTimeout(() => {
            unsubscribe();
            reject(new Error('Transaction timeout'));
        }, 60000); // 60 second timeout

        batchTx
            .signAndSend(keyPair, { nonce }, (result: SubmittableResultValue) => {
                const { status, events, dispatchError } = result;

                console.log(`Current status: ${status.type}`);

                if (status.isInBlock || status.isFinalized) {
                    clearTimeout(timeout);
                    unsubscribe();

                    if (dispatchError) {
                        let errorMessage;
                        if (dispatchError.isModule) {
                            const decoded = api.registry.findMetaError(dispatchError.asModule);
                            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
                        } else {
                            errorMessage = dispatchError.toString();
                        }
                        resolve(
                            transactions.map(() => ({
                                success: false,
                                hash: batchTx.hash.toString(),
                                status: status.type,
                                error: errorMessage,
                            }))
                        );
                    } else {
                        const results = transactions.map((_, index) => ({
                            success: true,
                            hash: batchTx.hash.toString(),
                            blockHash: status.asInBlock.toString(),
                            status: status.type,
                            index,
                        }));
                        resolve(results);
                    }
                } else if (status.isDropped || status.isInvalid || status.isUsurped) {
                    clearTimeout(timeout);
                    unsubscribe();
                    reject(new Error(`Transaction ${status.type}`));
                }
            })
            .then(unsub => {
                unsubscribe = unsub;
            })
            .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
    });
};

const createBatches = (api: ApiPromise, transactions: Transaction[]): Transaction[][] => {
    const batches: Transaction[][] = [[]];
    let currentBatchSize = 0;

    transactions.forEach(tx => {
        const txSize = api.tx[tx.module][tx.method](...tx.params).encodedLength;
        if (currentBatchSize + txSize > MAX_BATCH_SIZE) {
            batches.push([]);
            currentBatchSize = 0;
        }
        batches[batches.length - 1].push(tx);
        currentBatchSize += txSize;
    });

    return batches;
};

const submitBatchTransactions = async (
    api: ApiPromise,
    keyPair: KeyringPair,
    batches: Transaction[][],
    startNonce: number
): Promise<TransactionResult[]> => {
    let nonce = startNonce;
    const results: TransactionResult[] = [];

    for (const batch of batches) {
        const batchResults = await submitBatchTransaction(api, keyPair, batch, nonce);
        results.push(...batchResults);
        nonce++;
    }

    return results;
};

export const createTransactionManager = (rpcEndpoint: string, keypairUri: string) => {
    let api: ApiPromise | null = null;
    let keyPair: KeyringPair | null = null;

    const initialize = async (): Promise<void> => {
        api = await createApi(rpcEndpoint);
        keyPair = createKeyPair(keypairUri);
    };

    const ensureInitialized = async (): Promise<void> => {
        if (!api || !keyPair) {
            await initialize();
        }
    };

    const submit = async (transactions: Transaction[]): Promise<TransactionResult[]> => {
        await ensureInitialized();
        if (!api || !keyPair) {
            throw new Error('Transaction manager not initialized');
        }
        const nonce = await api.rpc.system.accountNextIndex(keyPair.address);
        console.log(`Starting nonce: ${nonce.toString()}`);

        const batches = createBatches(api, transactions);
        return await submitBatchTransactions(api, keyPair, batches, nonce.toNumber());
    };

    return { submit };
};
