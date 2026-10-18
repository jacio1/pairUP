import { Avatar } from "./ui/avatar";
import { Card } from "./ui/card";

export default function AdCard() {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card
          key={i}
          className="flex-row items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
        >
          <Avatar className="flex size-12 shrink-0 items-center justify-center bg-primary font-semibold text-primary-foreground">
            N
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold ">
              Ищу напарника для изучения React
            </h3>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Iure illo
              architecto molestias aliquid laudantium veniam voluptatem animi
              sit vero veritatis est nostrum laborum, autem corrupti, maiores
              ipsa at aut molestiae!
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">nickname</span>
              <span>·</span>
              <span>18 октября 2026</span>
            </div>
          </div>
          <span className="text-muted-foreground">→</span>
        </Card>
      ))}
    </div>
  );
}
