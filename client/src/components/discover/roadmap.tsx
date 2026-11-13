"use client";
import { JoinButton } from "@/components/auth/join-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BookOpen, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
export function Roadmap() {
  const t = useTranslations("Demo");
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <BookOpen size={16} />
            PairUp
          </div>
          <h1>{t("nextChapter")}</h1>
          <p>{t("roadmapText")}</p>
        </div>
      </div>
      <div className="coming-grid grid grid-cols-[repeat(3,_1fr)] gap-[15px] max-[760px]:gap-[10px] max-[480px]:grid-cols-1">
        {["matching", "studyRooms", "materials"].map((key) => (
          <Card
            className="block gap-0 ring-0 shadow-none coming-card [border:1px_solid_var(--border)] rounded-[12px] [background:color-mix(in_oklab,_var(--card)_46%,_transparent)] p-[18px] relative [&_>_svg]:text-muted-foreground [&_h3]:text-[11px] [&_h3]:text-muted-foreground [&_h3]:m-[13px_0_7px] [&_h3]:font-semibold [&_p]:text-[9px] [&_p]:text-muted-foreground [&_p]:leading-[1.8] max-[1000px]:p-[14px] max-[1000px]:[&_h3]:text-[10px] max-[760px]:[&_h3]:text-[10px] max-[760px]:[&_p]:text-[9px] max-[480px]:p-[17px] max-[480px]:[&_h3]:text-[12px] max-[480px]:[&_h3]:mt-[10px] max-[480px]:[&_p]:text-[10px]"
            key={key}
          >
            <Sparkles />
            <Badge
              variant="secondary"
              className="coming-badge [float:right] text-muted-foreground [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-[7px] tracking-[0.7px] p-[4px_6px] rounded-[4px] max-[480px]:text-[8px]"
            >
              {t("comingSoon")}
            </Badge>
            <h3>{t(key)}</h3>
            <p>{t(`${key}Text`)}</p>
          </Card>
        ))}
      </div>
      <div className="roadmap-cta mt-[30px]">
        <JoinButton />
      </div>
    </main>
  );
}
