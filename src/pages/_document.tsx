// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicons - Courthouse Brand */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#5B2AAE" />
        <meta name="msapplication-TileImage" content="/mstile-150x150.png" />
        <meta name="theme-color" content="#5B2AAE" />

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
          content="MyDurhamLaw AI Study Assistant - Your intelligent companion for UK law mastery. Built for Durham Law students."
        />
        <meta name="keywords" content="law, study, Durham, AI, assistant, legal education, Durham University" />
        <meta name="author" content="MyDurhamLaw Team" />
        <meta name="application-name" content="MyDurhamLaw" />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="MyDurhamLaw - Durham Law support, 24/7" />
        <meta property="og:description" content="Turn lectures into clarity. Turn deadlines into a plan. Integrity-first AI for Durham Law students." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mydurhamlaw.com/" />
        <meta property="og:site_name" content="MyDurhamLaw" />
        <meta property="og:image" content="https://mydurhamlaw.com/og/og-default.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="MyDurhamLaw - Durham Law support, 24/7" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MyDurhamLaw - Durham Law support, 24/7" />
        <meta name="twitter:description" content="Turn lectures into clarity. Turn deadlines into a plan." />
        <meta name="twitter:image" content="https://mydurhamlaw.com/og/og-default.png" />
        <meta name="twitter:image:alt" content="MyDurhamLaw - Durham Law support" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
