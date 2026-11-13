"use client";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof Bell;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="block rounded-[24px] border border-dashed bg-card/70 px-6 py-14 text-center ring-0 [&_h2]:text-xl [&_h2]:font-bold [&_p]:mx-auto [&_p]:mt-3 [&_p]:max-w-md [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted-foreground">
      <span className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon size={25} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </Card>
  );
}
