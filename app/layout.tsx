import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif-loaded",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-loaded",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://actuarial-intel.kr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Actuarial Intel Korea — 해외 계리자료 번역·한국형 해석 플랫폼",
    template: "%s | Actuarial Intel Korea",
  },
  description:
    "해외·국내 계리 자료를 선별 수집하고 한국어로 번역, 한국 보험 실무에 적용 가능한 도입방안을 제시합니다.",
  keywords: [
    "계리",
    "보험계리",
    "actuarial",
    "SOA",
    "mortality",
    "longevity",
    "K-ICS",
    "IFRS 17",
    "보험연구원",
    "KIRI",
  ],
  authors: [{ name: "Actuarial Intel Korea" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "Actuarial Intel Korea",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/brand/svg/11-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/png/11-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/png/11-favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/brand/png/03-app-icon-navy-256.png", sizes: "256x256", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1116" },
  ],
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${notoSerifKR.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
