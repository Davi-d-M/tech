"use client";

import React, { createContext, useContext } from "react";
import { StoreSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/useSettings";

interface SettingsContextProps {
  settings: StoreSettings;
}

const SettingsContext = createContext<SettingsContextProps>({
    settings: DEFAULT_SETTINGS
});

export const SettingsProvider = ({
    children,
    initialSettings
}: {
    children: React.ReactNode,
    initialSettings: StoreSettings
}) => {
  return (
    <SettingsContext.Provider value={{ settings: initialSettings || DEFAULT_SETTINGS }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  return context?.settings || DEFAULT_SETTINGS;
};
