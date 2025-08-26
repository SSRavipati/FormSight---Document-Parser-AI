

import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon } from './Icons.tsx';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  acceptedMimeTypes: string[];
  onError: (message: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, acceptedMimeTypes, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File | null) => {
    if (file && acceptedMimeTypes.includes(file.type)) {
      setFileName(file.name);
      onFileSelect(file);
    } else {
        onError(`Invalid file type. Please upload one of: ${acceptedMimeTypes.map(t => t.split('/')[1]).join(', ')}`);
    }
  }, [onFileSelect, acceptedMimeTypes, onError]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={`relative flex flex-col items-center justify-center w-full h-48 px-4 transition bg-gray-800 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-gray-700
          ${isDragging ? 'border-blue-500 bg-gray-700' : ''}
          ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {fileName ? (
          <div className="text-center">
            <FileIcon className="w-12 h-12 mx-auto text-green-400" />
            <p className="mt-2 font-semibold text-gray-200">{fileName}</p>
            <p className="text-sm text-gray-400">File selected. Ready to parse.</p>
          </div>
        ) : (
          <div className="text-center">
            <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-300">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PDF, PNG, JPG, WEBP, or GIF</p>
          </div>
        )}
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          accept={acceptedMimeTypes.join(',')}
          disabled={isLoading}
        />
      </label>
    </div>
  );
};

export default FileUpload;