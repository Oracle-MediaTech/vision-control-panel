import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { useTabs } from "./Tabs";

interface TabsTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const tabs = useTabs();

  const active = tabs.value === value;

  return (
    <button
      {...props}
      type="button"
      onClick={() => tabs.setValue(value)}
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-white text-black shadow"
          : "text-zinc-500 hover:text-black",
        className
      )}
    >
      {children}
    </button>
  );
}