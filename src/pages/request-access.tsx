import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Brain, ArrowLeft, Check } from 'lucide-react';

/**
 * Request Access Page (Durham Students Only)
 * 
 * Shows BEFORE Google OAuth
 * Students must request trial access with @durham.ac.uk email first
 * Then they can proceed to /login to authenticate
 */

export default function RequestAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState< string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    setError(null);

    try {
      const res = await fetch('/api/access/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to request access');
        setRequesting(false);
        return;
      }

      setSuccess(true);
      setRequesting(false);

      // Redirect to onboarding with email prefill
      setTimeout(() => {
        router.push(`/onboarding?email=${encodeURIComponent(email)}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Network error');
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-purple-100">
          {/* Icon */}
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Durham Students Only
          </h1>
          <p className="text-center text-gray-600 mb-8 text-sm">
            Request your 30-day free trial with your Durham University email
          </p>

          {!success ? (
            <>
              {/* Trial Request Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Durham Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@durham.ac.uk"
                    required
                    pattern=".*@durham\.ac\.uk$"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
                    disabled={requesting}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    ✅ Must be a valid @durham.ac.uk email address
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={requesting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                >
                  {requesting ? 'Requesting...' : 'Request Free Trial'}
                </button>
              </form>

              {/* Info Box */}
              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <h3 className="font-semibold text-blue-900 text-sm mb-2">What happens next?</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Instant approval for valid Durham emails</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>30-day free trial (full access)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Sign in with Google afterward</span>
                  </li>
                </ul>
              </div>

              {/* Already approved */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Already approved?{' '}
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                  Sign in here
                </Link>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-800 mb-2">Access Approved!</h2>
              <p className="text-gray-600 mb-6">
                Your 30-day trial has been activated.
                <br />
                Next: Complete your profile to continue...
              </p>
              <div className="animate-pulse">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full animate-[progress_2s_ease-in-out]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          MyDurhamLaw is exclusively for Durham University Law students
        </p>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
