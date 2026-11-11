import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { resolveLocale } from "./locale";

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get("NEXT_LOCALE")?.value,
    headerStore.get("accept-language") || "",
  );

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
