import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "../lib/providers";
import AppLayout from "../components/layout/AppLayout";
import { siteConfig as SITE_CONFIG, getAbsoluteUrl, getImageUrl } from "@/config/site";

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  authors: [{ name: `${SITE_CONFIG.name} Team` }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale.default,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: getImageUrl(SITE_CONFIG.images.ogImage),
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    creator: SITE_CONFIG.social.twitter,
    images: [getImageUrl(SITE_CONFIG.images.ogImage)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your actual code
    // yandex: 'your-yandex-verification-code',
    // other: 'your-other-verification-code',
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    types: {
      'application/rss+xml': [
        { url: '/rss.xml', title: `${SITE_CONFIG.name} RSS Feed` },
      ],
      'application/feed+json': [
        { url: '/feed.json', title: `${SITE_CONFIG.name} JSON Feed` },
      ],
    },
  },
  category: 'social media',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#007AFF',
}

// Viewport moved to metadata in Next.js 14

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={SITE_CONFIG.locale.language} suppressHydrationWarning>
      <head>
        <link rel="icon" href={SITE_CONFIG.images.favicon} />
        <link rel="apple-touch-icon" href={SITE_CONFIG.images.appIcon} />
        <link rel="manifest" href="/manifest.json" />
        
        {/* RSS/Atom Feeds */}
        <link rel="alternate" type="application/rss+xml" title={`${SITE_CONFIG.name} RSS Feed`} href="/rss.xml" />
        <link rel="alternate" type="application/feed+json" title={`${SITE_CONFIG.name} JSON Feed`} href="/feed.json" />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
        
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={SITE_CONFIG.name} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content={SITE_CONFIG.theme.primaryColor} />
        <meta name="color-scheme" content="light" />
        <meta name="apple-touch-fullscreen" content="yes" />
        {/* Google Tag Manager - Add your GTM ID */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script> */}
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_CONFIG.name,
              url: SITE_CONFIG.url,
              logo: getAbsoluteUrl(SITE_CONFIG.images.logo),
              sameAs: [
                SITE_CONFIG.social.facebook,
                SITE_CONFIG.social.twitter,
                SITE_CONFIG.social.instagram,
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: SITE_CONFIG.contact.email,
              },
            }),
          }}
        />
        {/* WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_CONFIG.name,
              url: SITE_CONFIG.url,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${SITE_CONFIG.url}/explore?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Register Firebase Messaging Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/firebase-messaging-sw.js')
                    .then(function(registration) {
                      console.log('Service Worker registered:', registration);
                    })
                    .catch(function(error) {
                      console.log('Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />

        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
