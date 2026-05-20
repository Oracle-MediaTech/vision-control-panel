import type { PM2Status } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  status: PM2Status;
}

export function Header({ status }: HeaderProps) {
  const badgeClass = status.running
    ? 'bg-success/20 text-emerald-300'
    : 'bg-red-900/40 text-red-300';
  const badgeText = status.running ? 'Running' : 'Stopped';

  return (
    <header className="bg-header text-header-foreground px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-success rounded-[10px] flex items-center justify-center text-xl font-bold text-white">
          V
        </div>
        <div>
          <h1 className="text-lg font-semibold">Vision Control Panel</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Church Management System</p>
        </div>
      </div>
      <span className={cn('px-3.5 py-1.5 rounded-full text-[13px] font-semibold', badgeClass)}>
        {badgeText}
      </span>
    </header>
  );
}
