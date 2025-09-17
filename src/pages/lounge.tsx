// src/pages/lounge.tsx
import Head from 'next/head';

export default function LoungePage() {
  return (
    <>
      <Head>
        <title>Student Lounge • MyDurhamLaw</title>
        <meta name="description" content="Hang out with classmates, share wins, and get support." />
      </Head>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Lounge</h1>
        <p className="text-gray-600 mt-2">
          The lounge is where you can share updates, ask for help, and celebrate wins with your cohort.
        </p>

        <div className="mt-8 rounded-2xl border bg-white shadow-sm p-6">
          <p className="text-gray-700">
            We’ll plug in the full lounge feed & composer next. For now, this page is live so the menu never 404s.
          </p>
        </div>
      </main>
    </>
  );
}
