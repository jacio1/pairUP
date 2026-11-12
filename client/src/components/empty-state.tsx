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
    <Card className="block gap-0 ring-0 shadow-none empty-state bg-card [border:1px_solid_var(--border)] rounded-[17px] text-center p-[55px_25px] [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:leading-[1.5] [&_p]:text-[13px] [&_p]:leading-[1.9] [&_p]:text-muted-foreground [&_p]:max-w-[490px] [&_p]:m-[12px_auto_0] [&_.secondary-button]:mt-5 max-[760px]:p-[40px_20px] max-[760px]:[&_h2]:text-[18px]">
      <span className="empty-icon inline-flex items-center justify-center bg-muted text-primary w-[65px] h-[65px] rounded-[20px] mb-[22px]">
        <Icon size={28} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </Card>
  );
}
