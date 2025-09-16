// src/components/billing/ManageBillingButton.tsx
'use client';

import { useState } from 'react';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function ManageBillingButton({ className, children }: Props) {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        const msg =
          data?.error ||
          'Unable to open billing portal. Complete checkout first, then try again.';
        alert(msg);
        return;
      }
      window.location.assign(data.url);
    } catch (e: any) {
      alert(e?.message || 'Unable to open billing portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className={
        className ??
        'px-3 py-2 rounded-md text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-60'
      }
      title="Manage subscription, payment method and invoices"
    >
      {children ?? (loading ? 'Opening…' : 'Manage Billing')}
    </button>
  );
}
