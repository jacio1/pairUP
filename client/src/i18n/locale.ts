export type Locale = "en" | "ru";
export function resolveLocale(
  cookie: string | undefined,
  acceptLanguage = "",
): Locale {
  if (cookie === "en" || cookie === "ru") return cookie;
  const choices = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [tag, ...params] = entry.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number(q.trim().slice(2)) : 1;
      return { language: tag.toLowerCase().split("-")[0], quality, index };
    })
    .filter(
      (item) =>
        Number.isFinite(item.quality) && item.quality > 0 && item.quality <= 1,
    )
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  return (
    (choices.find((item) => item.language === "ru" || item.language === "en")
      ?.language as Locale) || "en"
  );
}
