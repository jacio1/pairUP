"use server";
import { cookies } from "next/headers";
export async function setLocale(locale: string) {
  if (locale !== "ru" && locale !== "en") return;
  (await cookies()).set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE === "true",
  });
}
