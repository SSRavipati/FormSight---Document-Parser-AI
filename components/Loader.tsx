
import React from 'react';

const Loader: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <div
    className={`${className} animate-spin rounded-full border-2 border-white border-t-transparent`}
    role="status"
    aria-live="polite"
    aria-label="Loading"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

export default Loader;
