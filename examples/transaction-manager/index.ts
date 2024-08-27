import { createTransactionManager } from '../../backend/src/services/transactionManager/transactionManager';
import dotenv from '../../backend/node_modules/dotenv/lib/main';

dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'ws://localhost:9944';
const KEYPAIR_URI = process.env.KEYPAIR_URI || '//Alice';

const transactionManager = createTransactionManager(RPC_ENDPOINT, KEYPAIR_URI);

const exampleTransactions = [
    {
        module: 'balances',
        method: 'transferKeepAlive',
        params: ['st7MesMSaBwvDYPzkNMJFa6TFgAuL2wrWkuTDp2cqhgNVHrL3', 1000000000000],
    },
    {
        module: 'system',
        method: 'remarkWithEvent',
        params: ['random remark'],
    },
];

const runExample = async () => {
    try {
        console.log('Submitting transactions as a batch...');
        const results = await transactionManager.submit(exampleTransactions);

        results.forEach((result, index) => {
            console.log(`Transaction ${index + 1}:`);
            console.log(`  Success: ${result.success}`);
            console.log(`  Hash: ${result.hash}`);
            console.log(`  Status: ${result.status}`);
            if (result.blockHash) {
                console.log(`  Block Hash: ${result.blockHash}`);
            }
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            }
            console.log('---');
        });
    } catch (error) {
        console.error('Error running example:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
        }
    } finally {
        console.log('Example completed. Exiting...');
        process.exit(0);
    }
};

runExample().catch(console.error);
