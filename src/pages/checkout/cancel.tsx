// src/pages/checkout/cancel.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function CheckoutCancel() {
  return (
    <>
      <Head>
        <title>Checkout canceled</title>
      </Head>
      <main className="min-h-screen bg-gray-50 flex items-center">
        <div className="max-w-xl mx-auto px-6 py-12 text-center bg-white rounded-2xl shadow">
          <h1 className="text-2xl font-bold text-gray-800">No worries.</h1>
          <p className="mt-3 text-gray-600">
            Your checkout was canceled. You can restart it anytime.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/pricing"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 font-semibold"
            >
              Back to Pricing
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
