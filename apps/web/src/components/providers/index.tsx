"use client";

import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { FontSizeProvider } from "./font-size-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <FontSizeProvider>{children}</FontSizeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
