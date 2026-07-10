"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/** Pilihan ukuran font yang bisa diatur user. */
export type FontSize = "kecil" | "normal" | "besar";

export const FONT_SIZE_STORAGE_KEY = "homwok-font-size";
const DEFAULT_SIZE: FontSize = "normal";

function isFontSize(value: unknown): value is FontSize {
  return value === "kecil" || value === "normal" || value === "besar";
}

type FontSizeContextValue = {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
};

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

export function FontSizeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fontSize, setFontSizeState] = useState<FontSize>(DEFAULT_SIZE);

  // Selaraskan state React dengan nilai yang sudah diterapkan script inline
  // (lihat layout.tsx) supaya tidak ada kedipan ukuran saat halaman dimuat.
  useEffect(() => {
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (isFontSize(saved)) {
      setFontSizeState(saved);
    }
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    document.documentElement.setAttribute("data-font-size", size);
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
    } catch {
      // localStorage bisa gagal (mode privat); abaikan, atribut sudah diset.
    }
  }, []);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) {
    throw new Error("useFontSize harus dipakai di dalam FontSizeProvider");
  }
  return ctx;
}
