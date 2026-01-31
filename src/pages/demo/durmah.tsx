import React from "react";
import Head from "next/head";
import DemoLayout from "@/components/demo/DemoLayout";
import { MessageSquare, Send, Sparkles } from "lucide-react";

export default function DemoDurmah() {
  return (
    <DemoLayout activePage="durmah">
      <Head>
        <title>Durmah Chat Demo | Caseway</title>
      </Head>

      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Durmah Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Professor Durmah</h2>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Online • AI Tutor
              </p>
            </div>
          </div>
          <button className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
            Clear Chat
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm max-w-[80%]">
              <p className="text-sm">
                Hi Durmah. I'm struggling to understand the difference between
                'offer' and 'invitation to treat'. Can you explain it simply
                with a case example?
              </p>
            </div>
          </div>

          {/* Durmah Message */}
          <div className="flex gap-4 max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
              <span className="text-xs font-bold">D</span>
            </div>
            <div className="space-y-2">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed">
                  Hello Student. That's a classic contract law distinction!
                  <br />
                  <br />
                  Think of it like this:
                </p>
                <ul className="text-sm text-gray-800 space-y-2 mt-2 list-disc pl-4">
                  <li>
                    <strong>Invitation to Treat:</strong> "I am open to offers"
                    (Negotiation phase).
                  </li>
                  <li>
                    <strong>Offer:</strong> "I will sell this to you for £X"
                    (Legal power to bind).
                  </li>
                </ul>
                <p className="text-sm text-gray-800 mt-3">
                  <strong>Key Case:</strong>{" "}
                  <em>Pharmaceutical Society v Boots [1953]</em>
                  <br />
                  Items on a shelf are an <strong>invitation to treat</strong>.
                  The customer makes the <strong>offer</strong> when they take
                  the item to the till. The shopkeeper accepts the offer by
                  taking payment.
                </p>
              </div>
            </div>
          </div>

          {/* User Message */}
          <div className="flex justify-end">
            <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm max-w-[80%]">
              <p className="text-sm">
                Ah, that makes sense. Does the same rule apply to
                advertisements?
              </p>
            </div>
          </div>

          {/* Durmah Message (Typing) */}
          <div className="flex gap-4 max-w-[90%] animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
              <span className="text-xs font-bold">D</span>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-5 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area (Disabled) */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask a follow-up question..."
              disabled
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 px-5 pr-12 text-sm focus:outline-none cursor-not-allowed opacity-70"
            />
            <button className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-full opacity-50 cursor-not-allowed">
              <Send size={16} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            This is a demo.{" "}
            <a href="/signup" className="text-purple-600 hover:underline">
              Sign up
            </a>{" "}
            to chat with Durmah.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
