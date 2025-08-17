// /src/pages/legal/cookie-policy.tsx
import React from 'react';
import BackNavigation from '@/components/BackNavigation';

const CookiePolicyPage = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <BackNavigation className="mb-8" />
      <h1 className="text-4xl font-bold mb-6 text-purple-700">Cookie Policy</h1>

      <p className="mb-4">
        This Cookie Policy explains how <strong>MyDurhamLaw</strong> uses cookies and similar technologies to improve your experience on our platform.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">1. What Are Cookies?</h2>
      <p className="mb-4">
        Cookies are small text files stored on your device when you visit our website. They help us remember your preferences and enhance your user experience.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">2. How We Use Cookies</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>To keep you logged in and maintain session security</li>
        <li>To remember your preferences and interface settings</li>
        <li>To anonymously analyze traffic and usage patterns</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3">3. Managing Cookies</h2>
      <p className="mb-4">
        You can manage or disable cookies through your browser settings. However, please note that disabling cookies may limit some features of the platform.
      </p>

      <hr className="my-6 border-gray-300" />
      <p className="text-sm text-gray-600">
        Last updated: July 2025
      </p>
    </main>
  );
};

export default CookiePolicyPage;
