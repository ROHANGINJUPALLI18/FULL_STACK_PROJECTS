"use client";
import { createContext, useContext, useMemo, useState } from "react";
const FloatingAddContext = createContext(null);

export function AppProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const value = useMemo(() => ({ isModalOpen, setIsModalOpen }), [isModalOpen]);

  return (
    <FloatingAddContext.Provider value={value}>
      {children}
    </FloatingAddContext.Provider>
  );
}

export function useFloatingAddContext() {
  const ctx = useContext(FloatingAddContext);
  if (!ctx)
    throw new Error("useFloatingAddContext must be used inside AppProvider");
  return ctx;
}
