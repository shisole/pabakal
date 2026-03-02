"use client";

import { Children, type ReactNode, isValidElement, useState } from "react";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: ReactNode;
  className?: string;
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

function Tabs({ tabs, defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  const activePanel = Children.toArray(children).find((child) => {
    if (isValidElement<TabPanelProps>(child)) {
      return child.props.id === activeTab;
    }
    return false;
  });

  return (
    <div className={className}>
      <div className="flex border-b border-gray-200 dark:border-gray-700" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {activePanel}
      </div>
    </div>
  );
}

function TabPanel({ children, className }: TabPanelProps) {
  return <div className={className}>{children}</div>;
}

export default Tabs;
export { TabPanel };
