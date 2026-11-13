"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FilterSelect } from "./filter-select";
const defaultFilters = {
  subject: "all",
  level: "all",
  format: "all",
  schedule: "any",
};

export function SearchFilters() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = (
    Object.keys(defaultFilters) as (keyof typeof defaultFilters)[]
  ).filter((key) => filters[key] !== defaultFilters[key]).length;
  return (
    <section className="mb-6" aria-label={p("searchListings")}>
      <form className="relative" onSubmit={(event) => event.preventDefault()}>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 rounded-xl bg-card pr-20 pl-11 text-base shadow-none sm:pr-36 sm:text-sm"
          aria-label={p("searchListings")}
          placeholder={p("searchPlaceholder")}
        />
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-2 h-8 -translate-y-1/2 gap-2 px-2.5"
              />
            }
            aria-label={p("filters")}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">{p("filters")}</span>
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-[min(360px,calc(100vw-2rem))] gap-5 rounded-xl p-5"
          >
            <PopoverTitle>{p("filters")}</PopoverTitle>
            <div className="grid grid-cols-2 gap-4">
              <FilterSelect
                id="filter-subject"
                label={p("subject")}
                value={filters.subject}
                options={[
                  { value: "all", label: t("allSubjects") },
                  { value: "technology", label: t("technology") },
                  { value: "math", label: p("math") },
                  { value: "languages", label: t("languages") },
                ]}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    subject: value ?? defaultFilters.subject,
                  }))
                }
              />
              <FilterSelect
                id="filter-level"
                label={p("level")}
                value={filters.level}
                options={[
                  { value: "all", label: p("anyLevel") },
                  { value: "beginner", label: p("beginner") },
                  { value: "intermediate", label: p("intermediate") },
                  { value: "advanced", label: p("advanced") },
                ]}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    level: value ?? defaultFilters.level,
                  }))
                }
              />
              <FilterSelect
                id="filter-format"
                label={p("format")}
                value={filters.format}
                options={[
                  { value: "all", label: p("anyFormat") },
                  { value: "online", label: p("online") },
                  { value: "offline", label: p("offline") },
                  { value: "hybrid", label: p("hybrid") },
                ]}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    format: value ?? defaultFilters.format,
                  }))
                }
              />
              <FilterSelect
                id="filter-schedule"
                label={p("schedule")}
                value={filters.schedule}
                options={[
                  { value: "any", label: p("anyTime") },
                  { value: "today", label: p("today") },
                  { value: "evening", label: p("evenings") },
                  { value: "weekend", label: p("weekends") },
                ]}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    schedule: value ?? defaultFilters.schedule,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFilters(defaultFilters)}
                disabled={activeFilterCount === 0}
              >
                {p("resetFilters")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setFiltersOpen(false)}
              >
                {p("closeFilters")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </form>
    </section>
  );
}
