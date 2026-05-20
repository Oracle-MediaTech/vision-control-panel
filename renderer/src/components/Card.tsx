import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <section className={cn('bg-card rounded-xl p-5 border border-border', className)}>
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[15px] font-semibold mb-3.5 text-gray-700">{children}</h2>
  );
}
