import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';

export const createExtrinsicListener =
    (wsUrl: string) =>
    async (callback: (data: string) => void): Promise<() => void> => {
        const provider = new WsProvider(wsUrl);
        const api = await ApiPromise.create({ provider });

        console.log('Connected to Autonomys Network');

        const unsubscribe = await api.query.system.events(async events => {
            // Get the current block hash
            const blockHash = await api.rpc.chain.getBlockHash();
            const block = await api.derive.chain.getBlock(blockHash);

            for (const record of events) {
                const { event, phase } = record;

                if (api.events.system.Remarked.is(event)) {
                    console.log(`Remark detected from ${event.data[0].toString()}`);

                    if (phase.isApplyExtrinsic) {
                        const extrinsicIndex = phase.asApplyExtrinsic.toNumber();
                        const extrinsic = block.block.extrinsics[extrinsicIndex];

                        console.log(extrinsic.method.section, '.', extrinsic.method.method);
                        if (extrinsic.method.section === 'system' && extrinsic.method.method === 'remarkWithEvent') {
                            const remarkData = extrinsic.args[0].toString();
                            const asciiData = Buffer.from(remarkData.slice(2), 'hex').toString('ascii');
                            console.log(`Remark data (ASCII): ${asciiData}`);
                            callback(asciiData);
                        }
                    }
                }
            }
        });

        return () => {
            unsubscribe();
        };
    };