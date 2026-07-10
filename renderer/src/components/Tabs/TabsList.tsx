import { ReactNode } from "react";
import clsx from "clsx";

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({
  children,
  className,
}: TabsListProps) {
  return (
    <div
      className={clsx(
        "inline-flex h-10 items-center rounded-lg bg-zinc-100 p-1",
        className
      )}
    >
      {children}
    </div>
  );
}