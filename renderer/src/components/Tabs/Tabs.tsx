import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

interface TabsContextType {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function useTabs() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be inside <Tabs />");
  }

  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeValue = value ?? internalValue;

  const setValue = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }

    onValueChange?.(newValue);
  };

  const context = useMemo(
    () => ({
      value: activeValue,
      setValue,
    }),
    [activeValue]
  );

  return (
    <TabsContext.Provider value={context}>
      {children}
    </TabsContext.Provider>
  );
}