import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "cn";

export function NeuronMascot({
  className,
  icon = false,
  decorative = false,
}: {
  className?: string;
  icon?: boolean;
  decorative?: boolean;
}) {
  const t = useTranslations("Demo");
  return (
    <span
      className={cn(
        "inline-flex shrink-0",
        icon ? "size-8 overflow-hidden rounded-full bg-primary/5" : "size-32",
        className,
      )}
      aria-hidden={decorative || undefined}
    >
      <Image
        src="/mascots/neuron.png"
        width={512}
        height={512}
        alt={decorative ? "" : t("neuron")}
        sizes={icon ? "40px" : "(max-width: 640px) 96px, 192px"}
        className={cn(
          "pointer-events-none size-full object-contain",
          icon && "origin-[50%_25%] scale-[1.65]",
        )}
      />
    </span>
  );
}
