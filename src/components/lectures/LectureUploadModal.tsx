'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileAudio, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LectureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a'];

export default function LectureUploadModal({ isOpen, onClose, onSuccess }: LectureUploadModalProps) {
  const [title, setTitle] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [lectureDate, setLectureDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload MP3, M4A, WAV, WebM, or OGG.');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setUploadProgress(10);
    setError('');

    try {
      // Step 1: Create lecture and get signed URL
      const ext = file.name.split('.').pop() || 'mp3';
      const createRes = await fetch('/api/lectures/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          module_code: moduleCode || null,
          module_name: moduleName || null,
          lecturer_name: lecturerName || null,
          lecture_date: lectureDate || null,
          audio_ext: ext,
          audio_mime: file.type,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create lecture');
      }

      const { lectureId, signedUploadUrl } = await createRes.json();
      setUploadProgress(20);

      // Step 2: Upload file directly to Supabase Storage
      const uploadRes = await fetch(signedUploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload audio file');
      }
      setUploadProgress(50);

      // Step 3: Trigger processing (transcription + summarization)
      const processRes = await fetch('/api/lectures/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      });

      if (!processRes.ok) {
        // Don't fail completely - the lecture is uploaded, just processing failed
        console.error('Processing failed, but lecture was uploaded');
      }

      setUploadProgress(100);
      
      // Reset form and close
      setTitle('');
      setModuleCode('');
      setModuleName('');
      setLecturerName('');
      setLectureDate('');
      setFile(null);
      
      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Upload Lecture Recording</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lecture Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Contract Law"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Module Code & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module Code</label>
              <input
                type="text"
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value)}
                placeholder="e.g., LAW1081"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module Name</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g., British Law"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Lecturer & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer</label>
              <input
                type="text"
                value={lecturerName}
                onChange={(e) => setLecturerName(e.target.value)}
                placeholder="e.g., Prof. Smith"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Date</label>
              <input
                type="date"
                value={lectureDate}
                onChange={(e) => setLectureDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audio File <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${file ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-purple-700">
                  <FileAudio className="w-6 h-6" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">MP3, M4A, WAV, WebM, OGG (max {MAX_FILE_SIZE_MB}MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress < 50 ? 'Uploading...' : 'Processing (this may take a few minutes)...'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || !title || uploading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {uploading ? 'Processing...' : 'Upload & Transcribe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
