"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Input, Label, POSButton } from "@homwok/ui";
import { Coffee } from "lucide-react";

export default function LoginPage() {
  const [cred, setCred] = useState({ username: "", password: "" });
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/kasir");
  }, [isAuthenticated, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(cred);
    } catch {
      // error toast already surfaced by AuthProvider
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="bg-background p-8 rounded-lg border border-border w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <div className="bg-primary w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Homwok Coffee</h1>
          <p className="text-muted-foreground mt-1 uppercase text-xs tracking-widest">
            Sistem Kasir POS
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={cred.username}
              onChange={(e) => setCred({ ...cred, username: e.target.value })}
              placeholder="barista / manager"
              autoComplete="username"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={cred.password}
              onChange={(e) => setCred({ ...cred, password: e.target.value })}
              placeholder="password"
              autoComplete="current-password"
            />
          </div>
          <POSButton
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Memuat…" : "Masuk"}
          </POSButton>
        </form>

        <div className="mt-6 border-t border-dashed border-border pt-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Demo Login
          </p>
          <p className="text-xs mt-1 font-mono">
            barista / password · manager / password
          </p>
        </div>
      </div>
    </div>
  );
}
