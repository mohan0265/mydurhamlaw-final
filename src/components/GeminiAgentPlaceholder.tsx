import React from 'react';

export default function GeminiAgentPlaceholder() {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-blue-900">Gemini Live Agent</h3>
      <p className="mb-4 text-sm text-blue-700">
        Voice-enabled AI tutor integration is coming soon.
      </p>
      <button disabled className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed">
        Connect (Coming Soon)
      </button>
    </div>
  );
}
