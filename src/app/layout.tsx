import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nabzesardo.ir"),
  title: "نبض ساردو | رسانه مستقل خبری و تحلیلی جنوب کرمان",
  description:
    "خبرهای ساردوئیه، جیرفت و جنوب کرمان؛ گزارش‌های میدانی، حوادث، اجتماعی، فرهنگ و آب‌وهوا — سریع، دقیق و محلی.",
  keywords: ["نبض ساردو", "ساردوئیه", "اخبار جیرفت", "جنوب کرمان", "اخبار محلی"],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    siteName: "نبض ساردو",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
