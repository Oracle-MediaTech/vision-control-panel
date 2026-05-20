import { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { Card, CardTitle } from './Card';

interface LogViewerProps {
  active: boolean;
  lines: string[];
  onToggle: () => void;
  onClear: () => void;
}

export function LogViewer({ active, lines, onToggle, onClear }: LogViewerProps) {
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-2.5">
        <CardTitle>Logs</CardTitle>
        <div className="flex gap-1.5">
          <button
            onClick={onToggle}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-all inline-flex items-center gap-1"
          >
            <Terminal size={12} /> {active ? 'Hide Logs' : 'Show Logs'}
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-all inline-flex items-center gap-1"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {(active || lines.length > 0) && (
        <pre
          ref={logRef}
          className="bg-log-bg text-log-text p-3.5 rounded-lg font-mono text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-sm"
        >
          {lines.join('\n') || 'Waiting for logs...'}
        </pre>
      )}
    </Card>
  );
}
