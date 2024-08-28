import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { UploadResponse, Metadata, uploadFile, fetchMetadata } from '../api';

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const FileInput = styled.input`
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
`;

const SubmitButton = styled.button`
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: #0056b3;
    }
`;

const ErrorMessage = styled.p`
    color: #dc3545;
    margin-top: 1rem;
`;

const SuccessMessage = styled.div`
    margin-top: 1rem;
    padding: 1rem;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    color: #155724;
`;

const TransactionResult = styled.div`
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #e9ecef;
    border-radius: 4px;
`;

const LoadingOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const LoadingSpinner = styled.div`
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

const MetadataLink = styled.a`
    color: #007bff;
    text-decoration: none;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`;

const MetadataDisplay = styled.div`
    margin-top: 1rem;
    padding: 1rem;
    background-color: #e9ecef;
    border-radius: 4px;
`;

const FileUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [metadata, setMetadata] = useState<Metadata | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setIsLoading(true);
        setError(null);
        setUploadResponse(null);
        setMetadata(null);

        try {
            const reader = new FileReader();
            reader.onload = async e => {
                const base64Data = e.target?.result as string;
                const data = base64Data.split(',')[1]; // Remove the data URL prefix

                const response = await uploadFile(data, file.name, file.type);

                setUploadResponse(response);
                setIsLoading(false); // Move setIsLoading(false) here
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('An error occurred while uploading the file');
            console.error(err);
            setIsLoading(false); // Ensure setIsLoading(false) is called in case of error
        }
    };

    const handleFetchMetadata = async (cid: string) => {
        try {
            const response = await fetchMetadata(cid);
            setMetadata(response);
        } catch (err) {
            console.error('Error fetching metadata:', err);
            setError('Failed to fetch metadata');
        }
    };

    return (
        <div>
            <h2>File Upload</h2>
            <Form onSubmit={handleSubmit}>
                <FileInput type='file' onChange={handleFileChange} disabled={isLoading} />
                <SubmitButton type='submit' disabled={isLoading}>
                    {isLoading ? 'Uploading...' : 'Upload'}
                </SubmitButton>
            </Form>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {uploadResponse && (
                <SuccessMessage>
                    <h3>Upload Successful</h3>
                    <p>
                        CID:{' '}
                        <MetadataLink onClick={() => handleFetchMetadata(uploadResponse.result.cid)}>
                            {uploadResponse.result.cid}
                        </MetadataLink>
                        {metadata && (
                            <MetadataDisplay>
                                <h4>Metadata:</h4>
                                <p>CID: {metadata.dataCid}</p>
                                <p>Filename: {metadata.filename}</p>
                                <p>MIME Type: {metadata.mimeType}</p>
                                <p>Size: {metadata.totalSize} bytes</p>
                                <p>Chunks: {metadata.chunks.length}</p>
                                <h5>Chunk Details:</h5>
                                {metadata.chunks.map((chunk, index) => (
                                    <div key={index}>
                                        <p>
                                            Chunk {chunk.order}: CID: {chunk.cid}, Size: {chunk.size} bytes
                                        </p>
                                    </div>
                                ))}
                            </MetadataDisplay>
                        )}
                    </p>
                    <h4>Transaction Results:</h4>
                    {uploadResponse.result.transactionResults.map((result, index) => (
                        <TransactionResult key={index}>
                            <p>Block Hash: {result.blockHash}</p>
                            <p>Batch Transaction Hash: {result.batchTxHash}</p>
                            <p>Transaction Index: {result.index}</p>
                        </TransactionResult>
                    ))}
                </SuccessMessage>
            )}

            {isLoading && (
                <LoadingOverlay>
                    <LoadingSpinner />
                </LoadingOverlay>
            )}
        </div>
    );
};

export default FileUpload;
