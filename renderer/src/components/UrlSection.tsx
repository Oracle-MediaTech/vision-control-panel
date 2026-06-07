import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode } from 'lucide-react';
import type { LanInfo } from '../types';
import { Card, CardTitle } from './Card';

interface UrlRowProps {
  label: string;
  value: string;
}

function UrlRow({ label, value }: UrlRowProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const hasValue = !!value && value !== '—';

  useEffect(() => {
    if (!showQr || !hasValue) return;
    let cancelled = false;
    QRCode.toDataURL(value, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [showQr, value, hasValue]);

  const copy = () => {
    if (!hasValue) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-muted min-w-[140px]">{label}</span>
        <code className="flex-1 text-[13px] text-success bg-emerald-50 px-2.5 py-1.5 rounded-md break-all">
          {value}
        </code>
        <button
          onClick={() => setShowQr((s) => !s)}
          disabled={!hasValue}
          className="px-2.5 py-1 text-[11px] bg-gray-100 border border-gray-300 rounded-md cursor-pointer text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
          title="Show QR code"
        >
          <QrCode size={12} /> QR
        </button>
        <button
          onClick={copy}
          className="px-2.5 py-1 text-[11px] bg-gray-100 border border-gray-300 rounded-md cursor-pointer text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-all flex items-center gap-1"
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      {showQr && (
        <div className="mt-2 flex flex-col items-center gap-1.5 py-3 bg-gray-50 rounded-md border border-gray-200">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for ${label}`} width={220} height={220} />
          ) : (
            <div className="text-xs text-muted">Generating QR...</div>
          )}
          <span className="text-[11px] text-muted">Scan to open on a phone</span>
        </div>
      )}
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
        <UrlRow label="Admin Dashboard" value={info?.admin ?? '—'} />
        <UrlRow label="Attendance Terminal" value={info?.terminal ?? '—'} />
        <UrlRow label="API Endpoint" value={info?.api ?? '—'} />
      </div>
    </Card>
  );
}
