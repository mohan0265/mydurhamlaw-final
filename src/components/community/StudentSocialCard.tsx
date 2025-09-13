import React from "react";
import Link from "next/link";

export function StudentSocialCard() {
  return (
    <section id="social" aria-labelledby="social-heading" className="mb-8">
      <h2 id="social-heading" className="text-2xl font-bold mb-4 text-indigo-700">Student Social</h2>
      <div className="bg-white p-6 rounded shadow flex flex-col items-center">
        <div className="flex gap-6">
          <Link href="/lounge" legacyBehavior>
            <a className="btn-primary mr-2" tabIndex={0}>Premier Lounge</a>
          </Link>
          <Link href="/community-network" legacyBehavior>
            <a className="btn-secondary" tabIndex={0}>Community Network</a>
          </Link>
        </div>
        <p className="text-sm mt-3 text-gray-700">Connect, network, and thrive at Durham!</p>
      </div>
    </section>
  );
}
