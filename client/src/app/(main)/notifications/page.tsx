"use client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCheck, Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Notification = {
  id: number;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  avatar?: string;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Новое сообщение",
    text: "nickname: Привет! Ещё актуально?",
    time: "2 мин назад",
    unread: true,
    avatar: "N",
  },
  {
    id: 2,
    title: "Отклик на объявление",
    text: "Кто-то заинтересовался вашим объявлением «iPhone 15 Pro»",
    time: "15 мин назад",
    unread: true,
  },
  {
    id: 3,
    title: "Объявление одобрено",
    text: "Ваше объявление прошло модерацию и опубликовано",
    time: "1 ч назад",
    unread: false,
  },
  {
    id: 4,
    title: "Новый отзыв",
    text: "Вам оставили отзыв с оценкой 5 звёзд",
    time: "3 ч назад",
    unread: false,
    avatar: "A",
  },
  {
    id: 5,
    title: "Скидка на продвижение",
    text: "Скидка 30% на продвижение объявлений до конца недели",
    time: "Вчера",
    unread: false,
  },
  {
    id: 6,
    title: "Добро пожаловать!",
    text: "Спасибо за регистрацию. Начните с создания первого объявления",
    time: "2 дня назад",
    unread: false,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

  const hasUnread = notifications.some((n) => n.unread);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <header className="flex shrink-0 justify-end items-center gap-3 border-b px-4 py-3">
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5 text-xs"
            onClick={markAllRead}
          >
            <CheckCheck className="size-4" />
            Прочитать все
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <Bell className="size-10 text-muted-foreground" />
            <p className="text-sm font-medium">Пока нет уведомлений</p>
            <p className="text-xs text-muted-foreground">
              Здесь появятся сообщения, отклики и новости
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    n.unread ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    {n.avatar ? (
                      <Avatar className="flex size-10 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                        {n.avatar}
                      </Avatar>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <Bell className="size-4 text-muted-foreground" />
                      </div>
                    )}
                    {n.unread && (
                      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {n.time}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {n.text}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
