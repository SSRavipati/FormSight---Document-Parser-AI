
import React, { useRef, useEffect, useState } from 'react';
import { ExtractedField } from '../types.ts';

interface DocumentPreviewProps {
  filePreview: string | null;
  extractedData: ExtractedField[] | null;
  highlightedField: ExtractedField | null;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ filePreview, extractedData, highlightedField }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      }
    });
    const currentContainer = containerRef.current;
    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }
    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
    };
  }, []);
  
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  useEffect(() => {
    if (!filePreview) {
      setImageSize({ width: 0, height: 0 });
    }
  }, [filePreview]);

  const getOverlayStyle = (): React.CSSProperties => {
    if (!containerSize.width || !containerSize.height || !imageSize.width || !imageSize.height) {
      return { display: 'none' };
    }

    const containerRatio = containerSize.width / containerSize.height;
    const imageRatio = imageSize.width / imageSize.height;
    
    let scaledWidth: number;
    let scaledHeight: number;

    if (containerRatio > imageRatio) {
      scaledHeight = containerSize.height;
      scaledWidth = scaledHeight * imageRatio;
    } else {
      scaledWidth = containerSize.width;
      scaledHeight = scaledWidth / imageRatio;
    }

    const offsetX = (containerSize.width - scaledWidth) / 2;
    const offsetY = (containerSize.height - scaledHeight) / 2;

    return {
      position: 'absolute',
      left: `${offsetX}px`,
      top: `${offsetY}px`,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
    };
  };

  const renderBox = (box: number[], isHighlighted: boolean) => {
    const [x0, y0, x1, y1] = box;
    const style: React.CSSProperties = {
      left: `${(x0 / 1000) * 100}%`,
      top: `${(y0 / 1000) * 100}%`,
      width: `${((x1 - x0) / 1000) * 100}%`,
      height: `${((y1 - y0) / 1000) * 100}%`,
    };

    const baseClasses = "absolute transition-all duration-200 ease-in-out border-2 rounded-sm";
    const highlightClasses = isHighlighted 
      ? "border-yellow-300 bg-yellow-300 bg-opacity-40 shadow-lg scale-105" 
      : "border-pink-500 bg-pink-500 bg-opacity-20";

    return <div key={box.join('-')} style={style} className={`${baseClasses} ${highlightClasses}`}></div>;
  };
  
  const overlayStyle = getOverlayStyle();
  const highlightedBox = (highlightedField && highlightedField.page_number === 1) ? highlightedField.box : null;
  
  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px] md:min-h-0 bg-gray-800 rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
      {filePreview ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            ref={imageRef}
            src={filePreview}
            alt="Document preview"
            className="object-contain w-full h-full max-w-full max-h-full"
            onLoad={handleImageLoad}
          />
          {extractedData && (
            <div style={overlayStyle}>
              {extractedData
                  .filter(field => field.page_number === 1)
                  .map(field => renderBox(field.box, false))
              }
              {highlightedBox && renderBox(highlightedBox, true)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500">
          <p>Document preview will appear here</p>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;