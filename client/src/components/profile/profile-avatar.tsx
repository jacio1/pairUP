import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "cn";
const colors: Record<string, string> = {
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  peach:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
};
export function ProfileAvatar({
  name,
  color = "violet",
  className,
}: {
  name: string;
  color?: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-9 shrink-0", className)}>
      <AvatarFallback
        className={cn(
          "font-semibold [font-size:inherit]",
          colors[color] || colors.violet,
        )}
      >
        {name.trim().slice(0, 1).toUpperCase() || "P"}
      </AvatarFallback>
    </Avatar>
  );
}
