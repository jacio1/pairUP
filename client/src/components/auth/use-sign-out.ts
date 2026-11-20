"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks";
import { actions } from "@/lib/chat-state";
import { api, useLogoutMutation } from "@/lib/api";
export function useSignOut() {
  const dispatch = useAppDispatch(),
    router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();
  const [error, setError] = useState(false);
  async function signOut() {
    if (isLoading) return;
    setError(false);
    try {
      await logout().unwrap();
      dispatch(actions.session(null));
      dispatch(actions.room());
      dispatch(api.util.resetApiState());
      router.replace("/");
    } catch {
      setError(true);
    }
  }
  return { signOut, isLoading, error };
}
