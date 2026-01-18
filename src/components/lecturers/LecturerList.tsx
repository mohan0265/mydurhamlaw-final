import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, ArrowRight, BookOpen } from 'lucide-react';

export default function LecturerList() {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lecturers/list')
      .then(res => res.json())
      .then(data => {
        setLecturers(data.lecturers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading lecturers...</div>;

  if (lecturers.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
         <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
         <p className="text-gray-600 font-medium">No lecturers identified yet.</p>
         <p className="text-gray-500 text-sm mt-1">Upload lecture transcripts, and Durmah will auto-detect them.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {lecturers.map(lecturer => (
        <Link key={lecturer.id} href={`/study/lecturers/${lecturer.id}`}>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-purple-200 transition group cursor-pointer h-full flex flex-col justify-between">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {lecturer.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{lecturer.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                         <BookOpen className="w-3 h-3" /> {lecturer.lectureCount} Lectures processed
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
                <span>View Teaching Style</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-purple-600" />
             </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
