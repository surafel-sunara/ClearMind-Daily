import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/atkinson-hyperlegible-next/wght.css";
import "@fontsource/dm-serif-text/400.css";
import "./globals.css";
import { AccessibilityProvider } from "@/components/AccessibilityBar";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ProgressProvider } from "@/components/ProgressProvider";
import { StructuredData } from "@/components/StructuredData";
import { adClient, isAdClientConfigured } from "@/lib/ads";
import { accessibilityBootstrap } from "@/lib/accessibility";
import { siteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME + " | Free Large-Print Daily Puzzles", template: "%s | " + SITE_NAME },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
};
export const viewport: Viewport = { themeColor: "#faf8f5", colorScheme: "light" };

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isPro } = await getViewer();
  return <html lang="en-US" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: accessibilityBootstrap }} />
      <StructuredData />
    </head>
    <body>
      {!isPro && isAdClientConfigured() && <Script id="clearmind-adsense" strategy="afterInteractive" async crossOrigin="anonymous"
        src={"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + adClient} />}
      <AccessibilityProvider>
        <ProgressProvider userId={user?.id} syncEnabled={user?.syncScores ?? false}>
          <SiteHeader signedIn={Boolean(user)} isPro={isPro} />
          <main id="main" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </ProgressProvider>
      </AccessibilityProvider>
    </body>
  </html>;
}
