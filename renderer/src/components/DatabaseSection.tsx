import { Database, Loader, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardTitle } from './Card';
import { cn } from '../lib/utils';

interface DatabaseSectionProps {
  dumping: boolean;
  lastResult: { ok: boolean; message: string } | null;
  logs: string[];
  onDump: () => void;
}

export function DatabaseSection({ dumping, lastResult, logs, onDump }: DatabaseSectionProps) {
  return (
    <Card>
      <CardTitle>Database</CardTitle>
      <p className="text-[13px] text-muted mb-3.5">
        Dump the Postgres database (vfcdb) to a SQL file you can restore with <code>psql</code>.
        Requires <code>pg_dump</code> on PATH.
      </p>

      <button
        onClick={onDump}
        disabled={dumping}
        className={cn(
          'px-5 py-2.5 text-[13px] font-semibold border-none rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5',
          'bg-primary hover:bg-blue-700 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {dumping ? <Loader size={14} className="animate-spin" /> : <Database size={14} />}
        {dumping ? 'Dumping...' : 'Dump Database'}
      </button>

      {lastResult && (
        <div
          className={cn(
            'mt-3 flex items-start gap-2 text-[12px] px-3 py-2 rounded-md',
            lastResult.ok ? 'text-success bg-emerald-50' : 'text-danger bg-red-50',
          )}
        >
          {lastResult.ok ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <XCircle size={14} className="mt-0.5 shrink-0" />}
          <span className="break-all">{lastResult.message}</span>
        </div>
      )}

      {dumping && logs.length > 0 && (
        <pre className="mt-3 text-[11px] bg-gray-50 border border-gray-200 rounded-md p-2.5 max-h-32 overflow-y-auto whitespace-pre-wrap text-gray-600">
          {logs.join('\n')}
        </pre>
      )}
    </Card>
  );
}
