import React from "react";

interface LoungeLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

const LoungeLayout: React.FC<LoungeLayoutProps> = ({ left, center, right }) => (
  <div
    className="
      min-h-screen w-full
      bg-gradient-to-tr from-blue-50 via-purple-50 to-yellow-100
      flex flex-col items-center justify-start pt-8
      overflow-x-hidden
    "
    style={{ minHeight: "100vh" }}
    data-lounge
  >
    <div className="max-w-6xl w-full px-2 md:px-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-900 drop-shadow-lg rounded-2xl bg-white/80 backdrop-blur px-6 py-3 shadow-xl mx-auto w-max">
          🎓 Premier Student Lounge
        </h1>
        <p className="mt-2 text-lg text-gray-700 font-light">
          Relax, connect, and reset with your Durham law community.
        </p>
      </div>
      <div className="
        grid grid-cols-1 md:grid-cols-3 gap-6
        rounded-2xl shadow-xl
        bg-white/90 backdrop-blur
        px-2 md:p-6
        min-h-[64vh]
      ">
        {/* Left: Online users */}
        <section aria-label="Online Users" className="md:col-span-1 flex flex-col gap-4">
          {left}
        </section>
        {/* Center: Public chat */}
        <section aria-label="Public Lounge Chat" className="md:col-span-1 flex flex-col gap-4 border-x px-2 md:px-4">
          {center}
        </section>
        {/* Right: Unwind widgets */}
        <section aria-label="Unwind" className="md:col-span-1 flex flex-col gap-4">
          {right}
        </section>
      </div>
      <div className="mt-8 text-xs text-gray-500 text-center opacity-70">
        <span>
          Made with 🤍 for Durham Law | Floating mic stays clear thanks to extra padding!
        </span>
      </div>
    </div>
    {/* Safe area padding */}
    <div className="fixed bottom-0 right-0 w-24 h-24 pointer-events-none" aria-hidden="true" />
  </div>
);

export default LoungeLayout;
