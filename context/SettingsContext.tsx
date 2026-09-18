"use client";

import React, { createContext, useContext } from "react";
import { StoreSettings } from "@/lib/types";

interface SettingsContextProps {
  settings: StoreSettings;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider = ({
    children,
    initialSettings
}: {
    children: React.ReactNode,
    initialSettings: StoreSettings
}) => {
  return (
    <SettingsContext.Provider value={{ settings: initialSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context.settings;
};
