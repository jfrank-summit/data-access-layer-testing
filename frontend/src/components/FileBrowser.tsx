import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Metadata, getAllMetadata, downloadFile } from '../api';

const BrowserContainer = styled.div`
    margin-top: 2rem;
`;

const FileList = styled.ul`
    list-style-type: none;
    padding: 0;
`;

const FileItem = styled.li`
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    margin-bottom: 1rem;
    padding: 1rem;
`;

const DownloadButton = styled.button`
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    margin-top: 0.5rem;

    &:hover {
        background-color: #218838;
    }
`;

const FileBrowser: React.FC = () => {
    const [files, setFiles] = useState<Metadata[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const metadata = await getAllMetadata();
            setFiles(metadata);
        } catch (err) {
            console.error('Error fetching files:', err);
            setError('Failed to fetch files');
        }
    };

    const handleDownload = async (cid: string, filename: string) => {
        try {
            const blob = await downloadFile(cid);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename || cid;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading file:', err);
            setError('Failed to download file');
        }
    };

    return (
        <BrowserContainer>
            <h2>File Browser</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <FileList>
                {files.map(file => (
                    <FileItem key={file.dataCid}>
                        <h3>{file.filename || 'Unnamed File'}</h3>
                        <p>CID: {file.dataCid}</p>
                        <p>Size: {file.totalSize} bytes</p>
                        <p>Type: {file.mimeType || 'Unknown'}</p>
                        <DownloadButton onClick={() => handleDownload(file.dataCid, file.filename || file.dataCid)}>
                            Download
                        </DownloadButton>
                    </FileItem>
                ))}
            </FileList>
        </BrowserContainer>
    );
};

export default FileBrowser;
