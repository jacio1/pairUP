"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const subjects = [
  "Математика",
  "Физика",
  "Химия",
  "Биология",
  "Информатика",
  "Английский язык",
  "Русский язык",
  "История",
  "Обществознание",
  "Другое",
];

const levels = [
  "Начальный",
  "Средний",
  "Продвинутый",
  "Олимпиадный",
  "Подготовка к ОГЭ",
  "Подготовка к ЕГЭ",
];

const formats = ["Онлайн", "Офлайн", "Смешанный"];

export default function CreateListingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleAddPhotos = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">


      <form className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Заголовок
          </label>
          <Input
            id="title"
            placeholder="Например: Ищу напарника по математике для подготовки к ЕГЭ"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Предмет
            </label>
            <select
              id="subject"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите предмет
              </option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="level" className="text-sm font-medium">
              Уровень
            </label>
            <select
              id="level"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите уровень
              </option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="goal" className="text-sm font-medium">
            Цель занятий
          </label>
          <Input
            id="goal"
            placeholder="Например: подтянуть оценки, сдать экзамен, разобрать тему"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Формат занятий</label>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => (
              <label
                key={f}
                className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="radio"
                  name="format"
                  value={f}
                  className="sr-only"
                />
                {f}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="schedule" className="text-sm font-medium">
              Удобное время
            </label>
            <Input id="schedule" placeholder="Например: будни после 18:00" />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Город / район
            </label>
            <Input id="location" placeholder="Для офлайн-занятий" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            О себе и напарнике
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Расскажите о своём уровне, какие темы хотите разобрать и какого напарника ищете..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Продвигать объявление</p>
            <p className="text-xs text-muted-foreground">
              Показывать выше в поиске напарников
            </p>
          </div>
          <input type="checkbox" className="size-5 accent-primary" />
        </Card>
      </form>

      <footer className="flex shrink-0 items-center gap-2 border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button variant="outline" className="flex-1">
          Сохранить черновик
        </Button>
        <Button className="flex-1">Опубликовать</Button>
      </footer>
    </div>
  );
}