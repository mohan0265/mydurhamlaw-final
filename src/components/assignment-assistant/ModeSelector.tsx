'use client';

import React from 'react';
import { BookOpen, Zap, Clock, AlertCircle } from 'lucide-react';

interface ModeSelectorProps {
  onSelectMode: (mode: 'normal' | 'express') => void;
  assignmentData: any;
}

export default function ModeSelector({ onSelectMode, assignmentData }: ModeSelectorProps) {
  const daysUntilDue = assignmentData?.due_date 
    ? Math.ceil((new Date(assignmentData.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-[600px] flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assignment Assistant
          </h1>
          <p className="text-lg text-gray-600">
            {assignmentData?.title || 'Assignment'}
          </p>
          {daysUntilDue !== null && (
            <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
              <Clock size={16} />
              {daysUntilDue > 0 ? `${daysUntilDue} days until deadline` : 'Due today or overdue'}
            </p>
          )}
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* NORMAL MODE */}
          <button
            onClick={() => onSelectMode('normal')}
            className="group relative bg-white border-2 border-blue-200 hover:border-blue-500 rounded-2xl p-8 text-left transition-all hover:shadow-xl"
          >
            <div className="absolute top-6 right-6 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="text-blue-600" size={24} />
            </div>

            <div className="mb-4">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                RECOMMENDED
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Normal Mode
              </h3>
              <p className="text-sm text-gray-600">
                I have time to learn through this
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                <span>Full 6-stage educational journey</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                <span>Deep explanations & quizzes</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                <span>Teach you to write excellent essays</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                <span>Durham Band Estimator included</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <strong>Best for:</strong> Students with 1-2+ weeks until deadline, wanting to maximize learning
            </div>

            <div className="mt-6 text-center">
              <span className="text-blue-600 font-semibold group-hover:underline">
                Start Learning →
              </span>
            </div>
          </button>

          {/* EXPRESS MODE */}
          <button
            onClick={() => onSelectMode('express')}
            className="group relative bg-white border-2 border-amber-200 hover:border-amber-500 rounded-2xl p-8 text-left transition-all hover:shadow-xl"
          >
            <div className="absolute top-6 right-6 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <Zap className="text-amber-600" size={24} />
            </div>

            <div className="mb-4">
              <div className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                EMERGENCY
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Express Mode
              </h3>
              <p className="text-sm text-gray-600">
                I have a tight deadline - help fast!
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                <span>Get outline & structure NOW</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                <span>Sample scaffolds (example only)</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                <span>Explain-it-back quiz required</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                <span>You take full responsibility</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Best for:</strong> Less than 3 days until deadline, illness/emergency situations
            </div>

            <div className="mt-6 text-center">
              <span className="text-amber-600 font-semibold group-hover:underline">
                Get Help Fast →
              </span>
            </div>
          </button>
        </div>

        {/* Both Modes Include */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-gray-600" />
            Both Modes Include:
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>✓ AI usage tracking & transparency</div>
            <div>✓ Durham academic integrity compliance</div>
            <div>✓ OSCOLA citation support</div>
            <div>✓ Progress auto-save</div>
            <div>✓ Final rubric band estimate</div>
            <div>✓ AI declaration generator</div>
          </div>
        </div>

        {/* Ethics Note */}
        <p className="text-xs text-center text-gray-500">
          This tool helps you learn and improve your work. You remain responsible for the final submission and its accuracy.
        </p>
      </div>
    </div>
  );
}
