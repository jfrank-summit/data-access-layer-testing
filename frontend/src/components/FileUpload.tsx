import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

interface UploadedFile {
    cid: string;
    name: string;
    status: 'uploading' | 'success' | 'error';
    progress: number;
}

const API_URL = process.env.BACKEND_API || 'http://localhost:3000';

const FileUpload: React.FC = () => {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const uploadFile = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.onload = async e => {
            const fileData = e.target?.result as string;
            const base64Data = fileData.split(',')[1]; // Remove the data URL prefix

            const data = {
                data: base64Data,
                dataType: 'file',
                name: file.name,
                mimeType: file.type,
            };

            try {
                const response = await axios.post(`${API_URL}/submit`, data, {
                    headers: { 'Content-Type': 'application/json' },
                    onUploadProgress: progressEvent => {
                        const progress = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0;
                        updateFileProgress(file.name, progress);
                    },
                });

                updateFileStatus(file.name, 'success', response.data.metadataCid);
            } catch (error) {
                console.error('Upload failed:', error);
                updateFileStatus(file.name, 'error');
            }
        };

        reader.readAsDataURL(file);
    }, []);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles = acceptedFiles.map(file => ({
                file,
                cid: '',
                name: file.name,
                status: 'uploading' as const,
                progress: 0,
            }));

            setFiles(prevFiles => [...prevFiles, ...newFiles]);

            newFiles.forEach(({ file }) => uploadFile(file));
        },
        [uploadFile]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const updateFileProgress = (fileName: string, progress: number) => {
        setFiles(prevFiles => prevFiles.map(file => (file.name === fileName ? { ...file, progress } : file)));
    };

    const updateFileStatus = (fileName: string, status: 'success' | 'error', cid: string = '') => {
        setFiles(prevFiles => prevFiles.map(file => (file.name === fileName ? { ...file, status, cid } : file)));
    };

    return (
        <div>
            <div {...getRootProps()} style={dropzoneStyles}>
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>Drop the files here ...</p>
                ) : (
                    <p>Drag 'n' drop some files here, or click to select files</p>
                )}
            </div>
            <div>
                {files.map((file, index) => (
                    <div key={index}>
                        <p>{file.name}</p>
                        <progress value={file.progress} max='100' />
                        <p>{file.status === 'success' ? `CID: ${file.cid}` : file.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const dropzoneStyles: React.CSSProperties = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
};

export default FileUpload;
