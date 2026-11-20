"use client";
import { PageHeading } from "@/components/layout/page-heading";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { PostEditor, SocialFeed } from "./social-feed";

export function NewsPage() {
  const t = useTranslations("Social");
  const session = useAppSelector((state) => state.chat.session);
  const openAuth = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [composing, setComposing] = useState(false);

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-2xl">
        <PageHeading title={t("news")}>
          <Button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              if (!session) {
                openAuth();
                return;
              }
              dialog.current?.showModal();
              setComposing(true);
            }}
          >
            <PlusCircle className="size-4" />
            {t("createPost")}
          </Button>
        </PageHeading>
        <SocialFeed />
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="create-post-title"
        onClose={() => setComposing(false)}
        className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-auto overscroll-contain rounded-2xl border bg-card p-5 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <h2 id="create-post-title" className="mb-4 text-lg font-semibold">
          {t("newPost")}
        </h2>
        {composing && <PostEditor close={() => dialog.current?.close()} />}
      </dialog>
    </main>
  );
}
