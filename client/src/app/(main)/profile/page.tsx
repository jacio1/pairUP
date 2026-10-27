"use client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";

const menuItems = [
  { label: "Мои объявления", href: "/my-listings" },
  { label: "Избранное", href: "/favorites" },
  { label: "История заказов", href: "/orders" },
  { label: "Настройки", href: "/settings" },
];

export default function ProfilePage() {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <Avatar className="flex size-20 items-center justify-center bg-primary text-2xl font-semibold text-primary-foreground">
          N
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">nickname</h2>
          <p className="text-sm text-muted-foreground">user@example.com</p>
          <p className="text-xs text-muted-foreground">
            На сайте с января 2024
          </p>
        </div>
        <Button className="mt-2 w-full">Редактировать профиль</Button>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center gap-1 p-3">
          <span className="text-lg font-semibold">12</span>
          <span className="text-xs text-muted-foreground">Объявлений</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-3">
          <span className="text-lg font-semibold">4</span>
          <span className="text-xs text-muted-foreground">Заказов</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 p-3">
          <span className="text-lg font-semibold">8</span>
          <span className="text-xs text-muted-foreground">В избранном</span>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <ul className="divide-y">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm font-medium">{item.label}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
      >
        <LogOut className="mr-2 size-4" />
        Выйти из аккаунта
      </Button>
    </div>
  );
}
