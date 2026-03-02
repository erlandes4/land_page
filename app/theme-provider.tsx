"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cti-dark");
      if (stored !== null) setIsDark(stored === "true");
      else setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch (e) {
      // ignore (SSR safety)
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add("dark");
    else html.classList.remove("dark");
    try { localStorage.setItem("cti-dark", String(isDark)); } catch (e) {}
  }, [isDark]);

  const toggle = () => setIsDark((d) => !d);

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
}
