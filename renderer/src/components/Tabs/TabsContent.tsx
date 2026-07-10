import { ReactNode } from "react";
import clsx from "clsx";
import { useTabs } from "./Tabs";

interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabsContent({
  value,
  children,
  className,
}: TabsContentProps) {
  const tabs = useTabs();

  if (tabs.value !== value) {
    return null;
  }

  return (
    <div
      className={clsx("mt-4 outline-none", className)}
    >
      {children}
    </div>
  );
}