import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { LanInfo } from '../types';
import { Card, CardTitle } from './Card';

interface UrlRowProps {
  label: string;
  value: string;
}

function UrlRow({ label, value }: UrlRowProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value || value === '\u2014') return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-[13px] text-muted min-w-[140px]">{label}</span>
      <code className="flex-1 text-[13px] text-success bg-emerald-50 px-2.5 py-1.5 rounded-md break-all">
        {value}
      </code>
      <button
        onClick={copy}
        className="px-2.5 py-1 text-[11px] bg-gray-100 border border-gray-300 rounded-md cursor-pointer text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-all flex items-center gap-1"
      >
        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
      </button>
    </div>
  );
}

interface UrlSectionProps {
  info: LanInfo | null;
}

export function UrlSection({ info }: UrlSectionProps) {
  return (
    <Card>
      <CardTitle>LAN Access URLs</CardTitle>
      <div className="flex flex-col gap-1">
        <UrlRow label="Admin Dashboard" value={info?.admin ?? '\u2014'} />
        <UrlRow label="Attendance Terminal" value={info?.terminal ?? '\u2014'} />
        <UrlRow label="API Endpoint" value={info?.api ?? '\u2014'} />
      </div>
    </Card>
  );
}
