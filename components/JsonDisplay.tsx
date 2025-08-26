
import React from 'react';
import { ExtractedField } from '../types.ts';

interface JsonDisplayProps {
  data: ExtractedField[] | null;
  onHover: (field: ExtractedField | null) => void;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data, onHover }) => {
  const renderValue = (value: ExtractedField['value']) => {
    if (typeof value === 'boolean') {
      return <span className={value ? "text-green-400" : "text-red-400"}>{String(value)}</span>;
    }
    if (Array.isArray(value)) {
        if (!value.length || !value.every(row => Array.isArray(row))) {
            return <span className="text-purple-300">(Malformed Table)</span>;
        }
        const header = value[0] as string[] || [];
        const rows = value.slice(1) as string[][];

        return (
            <div className="inline-block align-top w-full overflow-x-auto">
                <table className="mt-1 w-full text-left table-auto border-collapse border border-gray-700 rounded-md text-xs">
                    <thead>
                        <tr className="bg-gray-700/50">
                            {header.map((h, i) => (
                                <th key={i} className="p-2 font-semibold text-pink-300 border-b border-r border-gray-600 last:border-r-0">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="odd:bg-gray-800/60 even:bg-gray-900/60">
                                {row.map((cell, j) => (
                                    <td key={j} className="p-2 border-r border-gray-600 last:border-r-0 text-sky-300">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    return <span className="text-sky-300">"{String(value)}"</span>;
  };

  const renderLabel = (label: string | null) => {
    if (label === null) {
        return <span className="text-gray-500">null</span>;
    }
    return <span className="text-sky-300">"{label}"</span>
  }

  if (!data) {
    return (
      <div className="w-full h-full p-4 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
        Extracted data will be shown here...
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 bg-gray-800 rounded-lg overflow-auto font-mono text-sm">
      <pre className="text-gray-300">
        <span className="text-gray-500">[</span>
        {data.map((item, index) => (
          <div
            key={index}
            className="ml-4 my-2 p-3 rounded-md bg-gray-900/50 hover:bg-gray-700/50 cursor-pointer"
            onMouseEnter={() => onHover(item)}
            onMouseLeave={() => onHover(null)}
          >
            <span className="text-gray-500">{`{`}</span>
            <div className="ml-4">
              <div>
                <span className="text-pink-400">"field_type"</span>: <span className="text-sky-300">"{item.field_type}"</span>,
              </div>
              <div>
                <span className="text-pink-400">"label"</span>: {renderLabel(item.label)},
              </div>
              <div>
                <span className="text-pink-400">"value"</span>: {renderValue(item.value)},
              </div>
              <div>
                <span className="text-pink-400">"box"</span>: <span className="text-yellow-300">[{item.box.join(', ')}]</span>,
              </div>
              <div>
                <span className="text-pink-400">"page_number"</span>: <span className="text-green-400">{item.page_number}</span>
              </div>
            </div>
            <span className="text-gray-500">{`}`}</span>
            {index < data.length - 1 && <span className="text-gray-500">,</span>}
          </div>
        ))}
        <span className="text-gray-500">]</span>
      </pre>
    </div>
  );
};

export default JsonDisplay;