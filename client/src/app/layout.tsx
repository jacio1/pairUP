import { Shell } from "@/components/layout/shell";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";

const manrope = localFont({
  src: "./fonts/Manrope-Variable.ttf",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Demo");
  return { title: t("pageTitle"), description: t("pageDescription") };
}
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6055d8",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale} className={manrope.variable} suppressHydrationWarning>
      <body className="flex h-dvh flex-col overflow-hidden font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                <Shell>{children}</Shell>
              </div>
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
