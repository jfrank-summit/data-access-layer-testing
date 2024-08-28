import { ApiPromise } from '@polkadot/api';
import { TransactionResult } from './types';

export const retrieveRemarkFromTransaction = async (
    api: ApiPromise,
    result: TransactionResult
): Promise<string | null> => {
    if (!result.success || !result.blockHash || result.index === undefined) {
        console.error('Invalid transaction result');
        return null;
    }

    try {
        const block = await api.rpc.chain.getBlock(result.blockHash);
        const extrinsics = block.block.extrinsics;

        if (result.index >= extrinsics.length) {
            console.error('Invalid extrinsic index');
            return null;
        }

        const extrinsic = extrinsics[result.index];

        if (extrinsic.method.section === 'system' && extrinsic.method.method === 'remarkWithEvent') {
            const remarkHex = extrinsic.args[0].toHex();
            return Buffer.from(remarkHex.slice(2), 'hex').toString('utf8');
        } else {
            console.error('Extrinsic is not a remark');
            return null;
        }
    } catch (error) {
        console.error('Error retrieving remark:', error);
        return null;
    }
};
