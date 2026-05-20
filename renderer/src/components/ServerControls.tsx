import { Play, Square, RotateCcw } from 'lucide-react';
import type { PM2Status } from '../types';
import { Card, CardTitle } from './Card';
import { cn } from '../lib/utils';

interface ServerControlsProps {
  status: PM2Status;
  loading: boolean;
  onAction: (action: 'start' | 'stop' | 'restart') => void;
}

interface BtnProps {
  onClick: () => void;
  disabled: boolean;
  variant: 'success' | 'danger' | 'warning';
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ActionButton({ onClick, disabled, variant, icon, children }: BtnProps) {
  const colors = {
    success: 'bg-success hover:bg-emerald-700 text-white',
    danger: 'bg-danger hover:bg-red-700 text-white',
    warning: 'bg-warning hover:bg-amber-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-5 py-2.5 text-[13px] font-semibold border-none rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        colors[variant],
      )}
    >
      {icon} {children}
    </button>
  );
}

export function ServerControls({ status, loading, onAction }: ServerControlsProps) {
  return (
    <Card>
      <CardTitle>Server Controls</CardTitle>
      <div className="flex gap-2.5">
        <ActionButton
          onClick={() => onAction('start')}
          disabled={loading || status.running}
          variant="success"
          icon={<Play size={14} />}
        >
          Start Server
        </ActionButton>
        <ActionButton
          onClick={() => onAction('stop')}
          disabled={loading || !status.running}
          variant="danger"
          icon={<Square size={14} />}
        >
          Stop Server
        </ActionButton>
        <ActionButton
          onClick={() => onAction('restart')}
          disabled={loading}
          variant="warning"
          icon={<RotateCcw size={14} />}
        >
          Restart Server
        </ActionButton>
      </div>
      {status.running && (
        <div className="mt-3 flex gap-5 text-xs text-muted">
          <span>PID: {status.pid}</span>
          <span>Memory: {(status.memory / 1024 / 1024).toFixed(1)} MB</span>
          <span>Restarts: {status.restarts}</span>
        </div>
      )}
    </Card>
  );
}
