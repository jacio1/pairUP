import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export default function MessageCard() {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card
          key={i}
          className="flex-row items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
        >
          <Avatar className="flex size-12 shrink-0 items-center justify-center bg-primary font-semibold text-primary-foreground">
            N
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">nickname</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                14:32
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure illo
              architecto molestias aliquid laudantium veniam voluptatem animi
              sit vero veritatis est nostrum laborum, autem corrupti, maiores
              ipsa at aut molestiae!
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
