import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Brain, ArrowLeft, Check, ShieldCheck } from 'lucide-react';

/**
 * Request Access Page (Public)
 * 
 * Allows non-Durham students (foundation, alumni, etc.) to request access.
 * Submits to /api/public/submit-access-request for Admin approval.
 */

export default function RequestAccessPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cohort: '',
    message: '',
    expected_term: '',
    college: '',
    website: '' // Honeypot
  });

  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    setError(null);

    // Basic Validation
    if (!formData.email.includes('@') || !formData.name || !formData.cohort) {
      setError('Please fill in all required fields.');
      setRequesting(false);
      return;
    }

    try {
      const res = await fetch('/api/public/submit-access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle deduplication error specifically if needed, or generic
        setError(data.error || 'Failed to submit request');
        setRequesting(false);
        return;
      }

      setSuccess(true);
      setRequesting(false);

    } catch (err: any) {
      setError(err.message || 'Network error');
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center text-slate-600 hover:text-purple-600 mb-6 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          
          {/* Header */}
          <div className="text-center mb-8">
             <div className="mx-auto mb-4 w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
               <Brain className="w-8 h-8 text-purple-600" />
             </div>
             <h1 className="text-2xl font-bold text-slate-900">Request Early Access</h1>
             <p className="text-slate-500 mt-2 text-sm text-balance">
               For non-Durham email users, foundation, alumni, or special academic access.
             </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* HONEYPOT - HIDDEN */}
              <div className="hidden" aria-hidden="true">
                <label>Do not fill this field</label>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={handleChange} />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="name@example.com"
                />
                <p className="text-xs text-slate-400 mt-1">If you have a @durham.ac.uk email, simply <Link href="/login" className="text-purple-600 hover:underline">Sign In</Link> directly.</p>
              </div>

              {/* Cohort Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Academic Status *</label>
                <select
                  name="cohort"
                  required
                  value={formData.cohort}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select your status...</option>
                  <option value="foundation">Starting Foundation Year</option>
                  <option value="year1">Incoming Year 1 (Pre-enrolment)</option>
                  <option value="alumni">Alumni</option>
                  <option value="other">Other / Special Access</option>
                </select>
              </div>

              {/* Optional Fields Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">Expected Term (Opt)</label>
                   <input
                    name="expected_term"
                    type="text"
                    value={formData.expected_term}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g. Michaelmas 2026"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">College (If known)</label>
                   <input
                    name="college"
                    type="text"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g. Castle"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for Request</label>
                <textarea
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full rounded-lg border-slate-300 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Please briefly explain why you need early access..."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={requesting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {requesting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          ) : (
             /* Success State */
            <div className="text-center py-8">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Request Received</h2>
              <p className="text-slate-600 mb-6">
                Thank you, {formData.name}.<br/>
                Our team will review your details shortly.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                You will receive an email invitation if your request is approved.
              </div>
              <Link href="/" className="inline-block mt-8 text-purple-600 font-semibold hover:underline">
                Return to Home
              </Link>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Protected by MyDurhamLaw Security • IP Logged
        </p>
      </div>
    </div>
  );
}
