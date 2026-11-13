"use client";
import { AuthGate } from "@/components/auth/auth-gate";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const protectedRoute =
    path !== "/" &&
    !path.startsWith("/listings/") &&
    !path.startsWith("/users/") &&
    path !== "/settings";
  const content = protectedRoute ? <AuthGate>{children}</AuthGate> : children;
  if (path.startsWith("/messages/"))
    return <div className="h-dvh w-full overflow-hidden">{content}</div>;
  return (
    <div className="flex min-h-dvh flex-col max-[760px]:pb-20">
      <Header />
      {content}
      <MobileNav />
    </div>
  );
}
