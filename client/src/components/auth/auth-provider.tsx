"use client";
import { AuthContext } from "@/components/auth/auth-context";
import { useState, type ReactNode } from "react";
import { AuthDialog } from "./auth-dialog";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <AuthContext.Provider value={() => setOpen(true)}>
      {children}
      <AuthDialog open={open} setOpen={setOpen} />
    </AuthContext.Provider>
  );
}
