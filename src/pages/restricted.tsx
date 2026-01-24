import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getRestrictedMessageFor, type AccessDenialReason } from '@/lib/access/config';
import { useState } from 'react';

/**
 * Restricted Access Page
 * 
 * Shown when user is denied access to the app
 * Reasons:
 * - domain_not_allowed: Email not @durham.ac.uk
 * - not_in_allowlist: Need to request trial
 * - trial_expired: Trial period ended
 * - account_blocked: Admin blocked account
 */

interface RestrictedPageProps {
  reason: AccessDenialReason;
  email?: string;
}

export default function RestrictedPage({ reason, email }: RestrictedPageProps) {
  const router = useRouter();
  const [requestEmail, setRequestEmail] = useState(email || '');
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    setError(null);

    try {
      const res = await fetch('/api/access/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
       setError(data.error || 'Failed to request access');
        setRequesting(false);
        return;
      }

      setSuccess(true);
      setRequesting(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Network error');
      setRequesting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-8 w-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
            Access Restricted
          </h1>

          {/* Message */}
          <p className="mb-6 text-center text-gray-600">
            {getRestrictedMessageFor(reason)}
          </p>

          {/* Action Link for Rejections */}
          {(reason === 'domain_not_allowed' || reason === 'not_in_allowlist') && !success && (
            <div className="text-center mb-8">
               <Link href="/request-access" className="text-purple-600 hover:text-purple-700 font-bold underline text-sm">
                  Not a Durham student? Request early access &rarr;
               </Link>
            </div>
          )}

          {/* Trial Request Form (only for allowlist issues) */}
          {(reason === 'not_in_allowlist') && !success && (
            <form onSubmit={handleRequestAccess} className="space-y-4">
               {/* ... as before ... */}
            </form>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-green-800 font-medium mb-2">✓ Request Received!</p>
              <p className="text-sm text-green-700">
                We'll review your details shortly. Redirecting...
              </p>
            </div>
          )}

          {/* Trial Expired / Blocked - Contact Support */}
          {(reason === 'trial_expired' || reason === 'account_blocked') && (
            <div className="text-center">
              <a
                href="mailto:support@mydurhamlaw.com"
                className="inline-block rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Contact Support
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600 max-w-sm mx-auto">
          Built for Durham Law students. MyDurhamLaw is an independent study companion designed around the Durham Law journey.
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const reason = (query.reason as AccessDenialReason) || 'not_in_allowlist';
  const email = query.email as string | undefined;

  return {
    props: {
      reason,
      email,
    },
  };
};
