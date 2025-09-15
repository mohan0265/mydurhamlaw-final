// src/pages/checkout/success.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function CheckoutSuccess() {
  return (
    <>
      <Head>
        <title>Welcome — Trial Started</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center">
        <div className="max-w-xl mx-auto px-6 py-12 text-center bg-white rounded-2xl shadow">
          <h1 className="text-2xl font-bold text-emerald-700">🎉 You’re in!</h1>
          <p className="mt-3 text-gray-700">
            Your free trial has started. You can manage billing anytime from your account.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 font-semibold"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-lg border px-5 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
