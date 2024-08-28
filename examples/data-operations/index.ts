import axios from 'axios';

const API_URL = 'http://localhost:3000';

const submitData = (data: string, filename?: string, mimeType?: string) =>
    axios.post(`${API_URL}/submit`, {
        data: Buffer.from(data).toString('base64'),
        filename,
        mimeType,
    });

const retrieveData = (metadataCid: string) => axios.get(`${API_URL}/retrieve/${metadataCid}`);

const logResult =
    (message: string) =>
    (result: unknown): void =>
        console.log(message, JSON.stringify(result, null, 2));

const handleError = (error: Error): void => console.error(error.message);

const generateLargeData = (size: number): string => {
    const chunk = 'A'.repeat(1024); // 1KB chunk
    return chunk.repeat(size);
};

const submitAndRetrieve = async (data: string, name?: string, mimeType?: string) => {
    const submitResponse = await submitData(data, name, mimeType);
    logResult('Submitted data. Metadata CID:')(submitResponse.data);

    const retrieveResponse = await retrieveData(submitResponse.data.metadataCid);

    // Compare the original data with the retrieved data
    console.log('Data integrity check:', data === retrieveResponse.data ? 'Passed' : 'Failed');
};

const main = async () => {
    const smallData = 'This is a small piece of data';
    const largeData = generateLargeData(256); // 256KB of data

    console.log('Submitting and retrieving small data:');
    submitAndRetrieve(smallData, 'raw');

    console.log('\nSubmitting and retrieving large data:');
    await submitAndRetrieve(largeData, 'large_file.txt', 'text/plain');
};

main().catch(handleError);
