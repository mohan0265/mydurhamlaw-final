// /src/pages/legal/ethics.tsx
import React from 'react';
import Link from 'next/link';
import BackNavigation from '@/components/BackNavigation';

const EthicsPage = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <BackNavigation className="mb-8" />
      <h1 className="text-4xl font-bold mb-6 text-purple-700">Our Ethical Commitment</h1>

      <p className="mb-4 text-lg">
        At <strong>MyDurhamLaw</strong>, we believe that integrity, honesty, and responsibility are the foundations of both legal education and the use of AI tools in academic settings. As we support future legal professionals, we are deeply committed to ethical AI use and transparent student support.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">1. Academic Integrity</h2>
      <p className="mb-4">
        Students must use the AI Assistant only as a support tool to clarify concepts, draft initial outlines, or review feedback. All submitted assignments must remain your original work. Misrepresenting AI-generated responses as your own is a violation of academic honesty policies.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">2. No Shortcut to Learning</h2>
      <p className="mb-4">
        Our AI tutor is designed to strengthen your reasoning, writing, and reflection skills. It is not a replacement for reading cases, engaging with your lecturers, or understanding legal doctrines. We aim to enhance—not replace—your academic journey.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">3. Transparent Use of AI</h2>
      <p className="mb-4">
        We disclose when and where AI is used across the platform. All answers are AI-generated using secure APIs, trained to provide educationally safe and context-aware responses.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">4. Respect for Privacy</h2>
      <p className="mb-4">
        All personal data and writing samples are securely stored, used only to personalize your experience, and never shared without consent. For more information, please review our <Link href="/legal/privacy-policy" className="text-blue-600 underline">Privacy Policy</Link>.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">5. Building an Ethical Legal Community</h2>
      <p className="mb-4">
        As future lawyers, you are bound by principles of justice, confidentiality, and truth. We mirror these values in our platform. Our team welcomes accountability and feedback from students, faculty, and parents.
      </p>

      <hr className="my-6 border-gray-300" />

      <p className="text-sm text-gray-600">
        This policy is reviewed regularly and was last updated in July 2025.
      </p>
    </main>
  );
};

export default EthicsPage;
