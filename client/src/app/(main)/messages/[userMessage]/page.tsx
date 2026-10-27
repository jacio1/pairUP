"use client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { useRef } from "react";

type Message = {
  id: number;
  text: string;
  time: string;
  isMine: boolean;
};

const messages: Message[] = [
  { id: 1, text: "Привет! Как дела?", time: "14:30", isMine: false },
  { id: 2, text: "Привет, всё отлично! Ты как?", time: "14:31", isMine: true },
  {
    id: 3,
    text: "Тоже хорошо. Слушай, ты уже посмотрел тот проект, о котором говорили?",
    time: "14:32",
    isMine: false,
  },
  {
    id: 4,
    text: "Да, глянул. Выглядит интересно, но нужно обсудить пару моментов.",
    time: "14:33",
    isMine: true,
  },
  {
    id: 5,
    text: "Отлично! Давай созвонимся вечером и всё обсудим.",
    time: "14:34",
    isMine: false,
  },
  { id: 6, text: "Договорились! Наберу в 19:00.", time: "14:35", isMine: true },
  {
    id: 7,
    text: "Договорились! Наберу в 19:00.",
    time: "14:35",
    isMine: false,
  },
  { id: 8, text: "Договорились! Наберу в 19:00.", time: "14:35", isMine: true },
  { id: 9, text: "Договорились! Наберу в 19:00.", time: "14:35", isMine: true },
  {
    id: 10,
    text: "Договорились! Наберу в 19:00.",
    time: "14:35",
    isMine: true,
  },
  {
    id: 11,
    text: "Договорились! Наберу в 19:00.",
    time: "14:35",
    isMine: true,
  },
  {
    id: 12,
    text: "Договорились! Наберу в 19:00.",
    time: "14:35",
    isMine: true,
  },
  {
    id: 13,
    text: "Договорились! Наберу в 19:00.",
    time: "14:35",
    isMine: false,
  },
  {
    id: 14,
    text: "Договорились! Наберу в 19:00.",
    time: "14:35",
    isMine: true,
  },
];
export default function UserMessagePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    // TODO: загрузить файлы / добавить в сообщение
    console.log(files);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-2xl flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <Avatar className="flex size-10 shrink-0 items-center justify-center bg-primary font-semibold text-primary-foreground">
          N
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">nickname</h2>
          <p className="text-xs text-muted-foreground">был(а) недавно</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.isMine ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {!msg.isMine && (
              <Avatar className="flex size-8 shrink-0 items-center justify-center bg-primary text-xs font-semibold text-primary-foreground">
                N
              </Avatar>
            )}
            <div
              className={`flex max-w-[75%] flex-col gap-1 ${
                msg.isMine ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2 text-sm ${
                  msg.isMine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground"
                }`}
              >
                {msg.text}
              </div>
              <span className="px-1 text-[11px] text-muted-foreground">
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={handleAttachClick}
          aria-label="Прикрепить файл"
        >
          <Paperclip className="size-5" />
        </Button>

        <Input placeholder="Написать сообщение..." className="flex-1" />

        <Button size="icon" className="shrink-0">
          <Send className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
