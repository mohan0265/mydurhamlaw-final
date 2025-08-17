// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Favicons for MyDurhamLaw */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#7c3aed" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="theme-color" content="#7c3aed" />

        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* SEO Meta Tags */}
        <meta
          name="description"
          content="MyDurhamLaw AI Study Assistant – Your intelligent companion for UK law mastery. Built for Durham Law students."
        />
        <meta name="keywords" content="law, study, Durham, AI, assistant, legal education, Durham University" />
        <meta name="author" content="MyDurhamLaw Team" />
        <meta name="application-name" content="MyDurhamLaw" />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="MyDurhamLaw AI Study Assistant" />
        <meta
          property="og:description"
          content="Your intelligent companion for UK law mastery"
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/android-chrome-512x512.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MyDurhamLaw AI Study Assistant" />
        <meta
          name="twitter:description"
          content="Your intelligent companion for UK law mastery"
        />
        <meta name="twitter:image" content="/android-chrome-512x512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
