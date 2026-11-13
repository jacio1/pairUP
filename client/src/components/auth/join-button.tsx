"use client";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
export function JoinButton({
  className = "primary-button min-h-10",
  label,
}: {
  className?: string;
  label?: string;
}) {
  const open = useAuth();
  const t = useTranslations("Auth");
  const session = useAppSelector((s) => s.chat.session);
  const router = useRouter();
  return (
    <Button
      className={className}
      onClick={() => (session ? router.push("/sessions") : open())}
    >
      {label || t("login")}
      <ArrowRight size={18} />
    </Button>
  );
}
