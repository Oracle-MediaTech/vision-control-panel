import { useState, useEffect, useRef } from 'react';
import { Terminal, Rocket, Trash2 } from 'lucide-react';
import { Card, CardTitle } from './Card';
import { cn } from '../lib/utils';

type Tab = 'server' | 'deploy';

interface LogViewerProps {
  serverActive: boolean;
  serverLogs: string[];
  deployLogs: string[];
  deploying: boolean;
  onToggleServer: () => void;
  onClearServer: () => void;
  onClearDeploy: () => void;
}

export function LogViewer({
  serverActive, serverLogs, deployLogs, deploying,
  onToggleServer, onClearServer, onClearDeploy,
}: LogViewerProps) {
  const [tab, setTab] = useState<Tab>('server');
  const logRef = useRef<HTMLPreElement>(null);

  const lines = tab === 'server' ? serverLogs : deployLogs;
  const hasContent = serverLogs.length > 0 || deployLogs.length > 0 || serverActive || deploying;

  // Auto-switch to deploy tab when deploy starts
  useEffect(() => {
    if (deploying) setTab('deploy');
  }, [deploying]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  const tabClass = (t: Tab) => cn(
    'px-4 py-1.5 text-xs font-semibold rounded-t-md cursor-pointer transition-all inline-flex items-center gap-1.5 border border-b-0',
    tab === t
      ? 'bg-log-bg text-log-text border-gray-700'
      : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200',
  );

  return (
    <Card>
      <div className="flex items-center justify-between mb-2.5">
        <CardTitle>Logs</CardTitle>
        <div className="flex gap-1.5">
          {tab === 'server' && (
            <button
              onClick={onToggleServer}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-all inline-flex items-center gap-1"
            >
              <Terminal size={12} /> {serverActive ? 'Stop Stream' : 'Start Stream'}
            </button>
          )}
          <button
            onClick={tab === 'server' ? onClearServer : onClearDeploy}
            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-all inline-flex items-center gap-1"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      <div className="flex gap-0.5">
        <button onClick={() => setTab('server')} className={tabClass('server')}>
          <Terminal size={12} /> Server
          {serverActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
        </button>
        <button onClick={() => setTab('deploy')} className={tabClass('deploy')}>
          <Rocket size={12} /> Deploy
          {deploying && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
        </button>
      </div>

      {hasContent && (
        <pre
          ref={logRef}
          className="bg-log-bg text-log-text p-3.5 rounded-b-lg rounded-tr-lg font-mono text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-sm"
        >
          {lines.join('\n') || (tab === 'server' ? 'No server logs. Click "Start Stream" to begin.' : 'No deploy logs yet.')}
        </pre>
      )}
    </Card>
  );
}
