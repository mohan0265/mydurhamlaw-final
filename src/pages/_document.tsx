// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicons - Caseway Brand */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#2B1B5A" />
        <meta name="msapplication-TileImage" content="/mstile-150x150.png" />
        <meta name="theme-color" content="#123733" />

        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* SEO Meta Tags */}
        <meta
          name="description"
          content="CASEWAY — Learn law | Write law | Speak law. Independent support for Durham students."
        />
        <meta
          name="keywords"
          content="law, study, Durham, AI, assistant, legal education, Durham University"
        />
        <meta name="author" content="CASEWAY Team" />
        <meta name="application-name" content="CASEWAY" />

        {/* Global Open Graph Defaults */}
        <meta property="og:site_name" content="CASEWAY" />
        <meta
          property="og:title"
          content="CASEWAY — Learn law | Write law | Speak law"
        />
        <meta
          property="og:description"
          content="Independent law student study platform — built for students at Durham University and beyond."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.casewaylaw.ai/" />
        <meta
          property="og:image"
          content="https://www.casewaylaw.ai/og/caseway-preview.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="CASEWAY - Learn law | Write law | Speak law"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="CASEWAY — Learn law | Write law | Speak law"
        />
        <meta
          name="twitter:description"
          content="Independent law student study platform — built for students at Durham University and beyond."
        />
        <meta
          name="twitter:image"
          content="https://www.casewaylaw.ai/og/caseway-preview.png"
        />
        <meta
          name="twitter:image:alt"
          content="CASEWAY - Learn law | Write law | Speak law"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
