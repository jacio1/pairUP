"use client";
import { AuthProvider } from "@/components/auth/auth-provider";
import { createStore } from "@/lib/store";
import { useState } from "react";
import { Provider } from "react-redux";
import { useChatConnection } from "./chat/use-chat-connection";
function Connection() {
  useChatConnection();
  return null;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(createStore);
  return (
    <Provider store={store}>
      <AuthProvider>
        <Connection />
        {children}
      </AuthProvider>
    </Provider>
  );
}
