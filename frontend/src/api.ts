import axios from 'axios';

const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

export interface UploadResponse {
    result: {
        cid: string;
        transactionResults: Array<{
            blockHash: string;
            batchTxHash: string;
            index: number;
        }>;
    };
}

export interface Metadata {
    dataCid: string;
    filename?: string;
    mimeType?: string;
    totalSize: number;
    totalChunks: number;
    chunks: Array<{
        cid: string;
        order: number;
        size: number;
    }>;
}

export const uploadFile = async (data: string, filename: string, mimeType: string): Promise<UploadResponse> => {
    const response = await axios.post<UploadResponse>(`${API_BASE_URL}/submit`, {
        data,
        filename,
        mimeType,
    });
    return response.data;
};

export const fetchMetadata = async (cid: string): Promise<Metadata> => {
    const response = await axios.get<Metadata>(`${API_BASE_URL}/metadata/${cid}`);
    return response.data;
};
