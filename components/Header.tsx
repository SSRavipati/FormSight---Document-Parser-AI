import React from 'react';
import { SparklesIcon } from './Icons.tsx';

const Header: React.FC = () => {
  return (
    <header className="w-full text-center p-4 md:p-6">
      <div className="flex items-center justify-center gap-3 mb-2">
        <SparklesIcon className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl md:text-4xl font-bold text-white">Document Parser AI</h1>
      </div>
      <p className="text-md md:text-lg text-gray-400">
        Upload a document image to instantly extract structured data with Gemini.
      </p>
    </header>
  );
};

export default Header;