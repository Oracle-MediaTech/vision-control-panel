import { Rocket, X, Circle, CheckCircle, XCircle, Loader, RotateCcw } from 'lucide-react';
import { Card, CardTitle } from './Card';
import { cn } from '../lib/utils';

const DEPLOY_STEPS = [
  'Prepare Environment',
  'Build Backend',
  'Build Admin Panel',
  'Build Terminal PWA',
  'Prepare Admin Standalone',
  'Copy Terminal to Server',
  'Restart Services',
];

interface DeploySectionProps {
  deploying: boolean;
  steps: Record<number, string>;
  failedStep: number | null;
  onStart: () => void;
  onContinue: () => void;
  onCancel: () => void;
}

function StepIcon({ status }: { status?: string }) {
  if (status === 'running') return <Loader size={16} className="animate-spin text-primary" />;
  if (status === 'done') return <CheckCircle size={16} className="text-success" />;
  if (status === 'error') return <XCircle size={16} className="text-danger" />;
  return <Circle size={16} className="text-muted-foreground" />;
}

export function DeploySection({ deploying, steps, failedStep, onStart, onContinue, onCancel }: DeploySectionProps) {
  const hasSteps = Object.keys(steps).length > 0;

  return (
    <Card>
      <CardTitle>Deploy System</CardTitle>
      <p className="text-[13px] text-muted mb-3.5">Build all projects, copy to server, and restart.</p>

      <div className="flex gap-2.5">
        {deploying ? (
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-[13px] font-semibold bg-danger hover:bg-red-700 text-white border-none rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5"
          >
            <X size={14} /> Cancel Deploy
          </button>
        ) : (
          <>
            <button
              onClick={onStart}
              className="px-7 py-3 text-sm font-semibold bg-primary hover:bg-blue-700 text-white border-none rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5"
            >
              <Rocket size={16} /> Deploy All
            </button>
            {failedStep !== null && (
              <button
                onClick={onContinue}
                className="px-5 py-3 text-sm font-semibold bg-warning hover:bg-amber-700 text-white border-none rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <RotateCcw size={16} /> Continue from Step {failedStep + 1}
              </button>
            )}
          </>
        )}
      </div>

      {hasSteps && (
        <div className="mt-4 flex flex-col gap-1.5">
          {DEPLOY_STEPS.map((name, i) => {
            const s = steps[i];
            const stepClass = cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] border-l-[3px]',
              !s && 'text-muted-foreground border-l-gray-200 bg-gray-50',
              s === 'running' && 'text-primary border-l-primary bg-blue-50 font-medium',
              s === 'done' && 'text-success border-l-success bg-emerald-50',
              s === 'error' && 'text-danger border-l-danger bg-red-50 ring-2 ring-danger/50',
            );

            return (
              <div key={i} className={stepClass}>
                <StepIcon status={s} />
                <span>{name}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
