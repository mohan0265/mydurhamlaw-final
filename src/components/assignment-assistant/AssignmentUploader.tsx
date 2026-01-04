'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface AssignmentUploaderProps {
  assignmentId?: string;
  onUploadComplete: (briefData: any) => void;
  onCancel: () => void;
}

export default function AssignmentUploader({ 
  assignmentId, 
  onUploadComplete, 
  onCancel 
}: AssignmentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingBrief, setExistingBrief] = useState<{
    bucket: string;
    path: string;
    originalName: string;
  } | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || 
          droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          droppedFile.type === 'application/msword') {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a PDF or Word document');
      }
    }
  }, []);

  // Check for existing brief on mount
  useEffect(() => {
    if (!assignmentId) {
      setChecking(false);
      return;
    }

    async function checkExistingBrief() {
      try {
        const res = await fetch(`/api/assignments/get-brief?assignmentId=${assignmentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.file) {
            setExistingBrief(data.file);
          }
        }
      } catch (error) {
        console.error('Error checking for existing brief:', error);
      } finally {
        setChecking(false);
      }
    }

    checkExistingBrief();
  }, [assignmentId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('Not connected to database');
      setUploading(false);
      return;
    }

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `assignment-briefs/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath);

      setUploading(false);
      setParsing(true);

      // 3. Parse the document
      const parseResponse = await fetch('/api/assignment/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: publicUrl,
          fileName: file.name,
          assignmentId,
        }),
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse document');
      }

      const parsedData = await parseResponse.json();
      
      setParsing(false);
      toast.success('Assignment brief uploaded and parsed!');
      onUploadComplete(parsedData);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
      setUploading(false);
      setParsing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Assignment Brief</h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>
      </div>

      {checking && (
        <div className="p-6 text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-violet-600" size={32} />
          <p className="text-gray-600">Checking for existing brief...</p>
        </div>
      )}

      {!checking && existingBrief && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <p className="font-semibold text-green-800 mb-1">Brief already uploaded</p>
              <p className="text-sm text-green-700">{existingBrief?.originalName || 'assignment-brief.pdf'}</p>
              <button
                onClick={() => setExistingBrief(null)}
                className="mt-2 text-sm text-green-700 underline hover:text-green-800"
              >
                Upload different file
              </button>
            </div>
          </div>
        </div>
      )}

      {!checking && !existingBrief && !file && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Drag and drop your assignment brief here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <label className="inline-block">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="px-6 py-3 bg-violet-600 text-white rounded-lg cursor-pointer hover:bg-violet-700 transition inline-block">
              Browse Files
            </span>
          </label>
          <p className="text-xs text-gray-400 mt-4">Supports PDF and Word documents</p>
        </div>
      )}

      {!checking && !existingBrief && file && (
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <FileText className="text-violet-600 flex-shrink-0" size={40} />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={uploading || parsing}
            >
              <X size={20} />
            </button>
          </div>

          {(uploading || parsing) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={20} />
              <span className="text-sm text-blue-800">
                {uploading ? 'Uploading...' : 'Parsing document with AI...'}
              </span>
            </div>
          )}

          {!uploading && !parsing && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">AI will extract:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Deadline and word limit</li>
                  <li>Module code and name</li>
                  <li>Assignment question/brief</li>
                  <li>Submission requirements</li>
                </ul>
                <p className="mt-2 text-xs">You can edit any details after parsing.</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || parsing}
              className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
            >
              {uploading ? 'Uploading...' : parsing ? 'Parsing...' : 'Upload & Parse'}
            </button>
            <button
              onClick={onCancel}
              disabled={uploading || parsing}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
