
import React, { useState, useCallback } from 'react';
import { ExtractedField } from './types.ts';
import { parseDocument } from './services/geminiService.ts';
import Header from './components/Header.tsx';
import FileUpload from './components/FileUpload.tsx';
import DocumentPreview from './components/DocumentPreview.tsx';
import JsonDisplay from './components/JsonDisplay.tsx';
import Loader from './components/Loader.tsx';
import { SparklesIcon } from './components/Icons.tsx';

declare global {
    interface Window {
        pdfjsLib: any;
    }
}

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;
}


const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedField[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedField, setHighlightedField] = useState<ExtractedField | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setExtractedData(null);
    setFilePreview(null); 

    if (selectedFile.type === 'application/pdf' && window.pdfjsLib) {
      try {
        const fileBuffer = await selectedFile.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument(fileBuffer).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          setFilePreview(canvas.toDataURL());
        } else {
          throw new Error('Could not create canvas context for PDF preview.');
        }

      } catch (e) {
        setError(`Error generating PDF preview: ${e instanceof Error ? e.message : 'Unknown error'}`);
        setFile(null);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const handleParse = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        if (!base64String) {
          throw new Error("Could not read the file correctly.");
        }
        const data = await parseDocument(base64String, file.type);
        setExtractedData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError("Failed to read file.");
        setIsLoading(false);
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4">
      <Header />
      <main className="w-full max-w-7xl flex-grow flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              acceptedMimeTypes={ACCEPTED_MIME_TYPES}
              onError={setError}
            />
            <button
              onClick={handleParse}
              disabled={!file || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              {isLoading ? <Loader /> : <SparklesIcon className="w-5 h-5" />}
              <span>{isLoading ? 'Parsing Document...' : 'Parse Document'}</span>
            </button>
            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg text-center">{error}</div>}
          </div>

          <div className="h-[40vh] md:h-auto md:min-h-[350px]">
            <DocumentPreview
              filePreview={filePreview}
              extractedData={extractedData}
              highlightedField={highlightedField}
            />
          </div>

          <div className="md:col-span-2 h-[50vh] md:h-[60vh]">
            <JsonDisplay data={extractedData} onHover={setHighlightedField} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;