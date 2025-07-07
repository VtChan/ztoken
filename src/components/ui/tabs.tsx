"use client"

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const activeValue = value ?? internalValue;

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  // Pass activeValue to TabsList and TabsContent children
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        activeValue,
        onValueChange: handleValueChange,
      });
    }
    return child;
  });

  return (
    <div className={cn("w-full", className)}>
      {enhancedChildren}
    </div>
  );
}

interface TabsListProps {
  className?: string;
  children: ReactNode;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

export function TabsList({
  className,
  children,
  activeValue,
  onValueChange,
}: TabsListProps) {
  // Pass activeValue and onValueChange to TabsTrigger children
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        activeValue,
        onValueChange,
      });
    }
    return child;
  });

  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1", className)}>
      {enhancedChildren}
    </div>
  );
}

interface TabsTriggerProps {
  className?: string;
  value: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function TabsTrigger({
  className,
  value,
  activeValue,
  onValueChange,
  children,
}: TabsTriggerProps) {
  const isActive = activeValue === value;
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        className
      )}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  className?: string;
  value: string;
  activeValue?: string;
  children: ReactNode;
}

export function TabsContent({
  className,
  value,
  activeValue,
  children,
}: TabsContentProps) {
  const isActive = activeValue === value;
  
  if (!isActive) return null;
  
  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  );
} 