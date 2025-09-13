
'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '@/lib/flags';
import { resilientFetch } from '@/lib/resilient-fetch';
import { BookOpen, Plus, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Reference {
  id?: string;
  type: 'case' | 'statute' | 'book' | 'article' | 'website' | 'other';
  fields: Record<string, string>;
  formatted?: string;
  lintMessages?: string[];
}

interface Props {
  assignmentId?: string;
  onReferencesChange?: (references: Reference[]) => void;
  initialReferences?: Reference[];
}

const REFERENCE_TYPES = [
  { value: 'case', label: 'Case Law' },
  { value: 'statute', label: 'Statute/Legislation' },
  { value: 'book', label: 'Book/Textbook' },
  { value: 'article', label: 'Journal Article' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];

const FIELD_CONFIGS = {
  case: [
    { key: 'caseName', label: 'Case Name', required: true, placeholder: 'e.g., Donoghue v Stevenson' },
    { key: 'citation', label: 'Citation', required: true, placeholder: 'e.g., [1932] AC 562' },
    { key: 'court', label: 'Court', required: false, placeholder: 'e.g., House of Lords' },
    { key: 'year', label: 'Year', required: false, placeholder: 'e.g., 1932' },
    { key: 'judge', label: 'Judge', required: false, placeholder: 'e.g., Lord Atkin' },
    { key: 'paragraph', label: 'Paragraph', required: false, placeholder: 'e.g., [32]' },
  ],
  statute: [
    { key: 'title', label: 'Title', required: true, placeholder: 'e.g., Human Rights Act' },
    { key: 'year', label: 'Year', required: true, placeholder: 'e.g., 1998' },
    { key: 'chapter', label: 'Chapter', required: false, placeholder: 'e.g., 42' },
    { key: 'section', label: 'Section', required: false, placeholder: 'e.g., 3' },
    { key: 'subsection', label: 'Subsection', required: false, placeholder: 'e.g., 1' },
  ],
  book: [
    { key: 'author', label: 'Author(s)', required: true, placeholder: 'e.g., John Smith' },
    { key: 'title', label: 'Title', required: true, placeholder: 'e.g., Contract Law Principles' },
    { key: 'edition', label: 'Edition', required: false, placeholder: 'e.g., 3rd' },
    { key: 'publisher', label: 'Publisher', required: false, placeholder: 'e.g., Oxford University Press' },
    { key: 'year', label: 'Year', required: true, placeholder: 'e.g., 2023' },
    { key: 'pages', label: 'Pages', required: false, placeholder: 'e.g., 45-67' },
  ],
  article: [
    { key: 'author', label: 'Author', required: true, placeholder: 'e.g., Jane Doe' },
    { key: 'title', label: 'Article Title', required: true, placeholder: 'e.g., Modern Contract Theory' },
    { key: 'journal', label: 'Journal', required: true, placeholder: 'e.g., Cambridge Law Journal' },
    { key: 'year', label: 'Year', required: false, placeholder: 'e.g., 2023' },
    { key: 'volume', label: 'Volume', required: false, placeholder: 'e.g., 82' },
    { key: 'issue', label: 'Issue', required: false, placeholder: 'e.g., 3' },
    { key: 'pages', label: 'Pages', required: false, placeholder: 'e.g., 456-478' },
  ],
  website: [
    { key: 'author', label: 'Author', required: false, placeholder: 'e.g., UK Government' },
    { key: 'title', label: 'Page Title', required: true, placeholder: 'e.g., Guide to Employment Law' },
    { key: 'website', label: 'Website Name', required: false, placeholder: 'e.g., gov.uk' },
    { key: 'url', label: 'URL', required: true, placeholder: 'https://...' },
    { key: 'accessDate', label: 'Access Date', required: false, type: 'date' },
  ],
  other: [
    { key: 'description', label: 'Description', required: true, placeholder: 'Describe the reference' },
    { key: 'details', label: 'Additional Details', required: false, placeholder: 'Any additional information' },
  ],
};

export default function OSCOLAForm({ assignmentId, onReferencesChange, initialReferences = [] }: Props) {
  const isEnabled = useFeatureFlag('ff_assignment_oscola');
  const [references, setReferences] = useState<Reference[]>(initialReferences);
  const [showPreview, setShowPreview] = useState(true);
  const [isFormatting, setIsFormatting] = useState<string | null>(null);

  useEffect(() => {
    if (initialReferences.length > 0) {
      setReferences(initialReferences);
    }
  }, [initialReferences]);

  useEffect(() => {
    onReferencesChange?.(references);
  }, [references, onReferencesChange]);

  const addReference = () => {
    const newRef: Reference = {
      type: 'case',
      fields: {},
    };
    setReferences([...references, newRef]);
  };

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const updateReference = (index: number, updates: Partial<Reference>) => {
    const updated = [...references];
    updated[index] = { ...updated[index], ...updates };
    setReferences(updated);
  };

  const updateReferenceField = (index: number, field: string, value: string) => {
    const updated = [...references];
    updated[index].fields[field] = value;
    setReferences(updated);
    
    // Clear previous formatting when fields change
    if (updated[index].formatted) {
      updated[index].formatted = undefined;
      updated[index].lintMessages = undefined;
    }
  };

  const formatReference = async (index: number) => {
    const reference = references[index];
    
    if (!reference.type || Object.keys(reference.fields).length === 0) {
      toast.error('Please fill in reference details before formatting');
      return;
    }

    try {
      setIsFormatting(reference.id || index.toString());

      const response = await resilientFetch('/netlify/functions/oscola', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reference.type,
          fields: reference.fields,
        }),
        endpoint: 'oscola',
      });

      const result = await response.json();
      
      updateReference(index, {
        formatted: result.formattedString,
        lintMessages: result.lintMessages || [],
      });

      if (result.lintMessages && result.lintMessages.length > 0) {
        toast.error(`Formatting completed with ${result.lintMessages.length} suggestion(s)`);
      } else {
        toast.success('Reference formatted successfully!');
      }
    } catch (error) {
      console.error('OSCOLA formatting error:', error);
      toast.error('Failed to format reference');
    } finally {
      setIsFormatting(null);
    }
  };

  const formatAllReferences = async () => {
    for (let i = 0; i < references.length; i++) {
      await formatReference(i);
      // Add small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const exportBibliography = () => {
    const bibliography = references
      .filter(ref => ref.formatted)
      .map(ref => ref.formatted)
      .join('\n\n');

    if (!bibliography) {
      toast.error('No formatted references to export');
      return;
    }

    const blob = new Blob([`# Bibliography\n\n${bibliography}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bibliography.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Bibliography exported!');
  };

  if (!isEnabled) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <div className="text-gray-600">OSCOLA Reference Manager is not available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">OSCOLA References</h2>
              <p className="text-sm text-gray-600">Manage and format your legal references</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
            </button>
            
            <button
              onClick={formatAllReferences}
              disabled={references.length === 0}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Format All
            </button>
            
            <button
              onClick={exportBibliography}
              disabled={references.filter(r => r.formatted).length === 0}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Bibliography
            </button>
          </div>
        </div>
      </div>

      {/* References List */}
      <div className="p-6">
        {references.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <div className="text-gray-600 mb-4">No references added yet</div>
            <button
              onClick={addReference}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Reference</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {references.map((reference, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      Reference {index + 1}
                    </span>
                    <select
                      value={reference.type}
                      onChange={(e) => updateReference(index, { 
                        type: e.target.value as Reference['type'],
                        fields: {}, // Clear fields when type changes
                        formatted: undefined,
                        lintMessages: undefined,
                      })}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {REFERENCE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => formatReference(index)}
                      disabled={isFormatting === (reference.id || index.toString())}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      {isFormatting === (reference.id || index.toString()) ? 'Formatting...' : 'Format'}
                    </button>
                    <button
                      onClick={() => removeReference(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Reference Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {FIELD_CONFIGS[reference.type]?.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={field.type || 'text'}
                        value={reference.fields[field.key] || ''}
                        onChange={(e) => updateReferenceField(index, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Formatted Output */}
                {showPreview && reference.formatted && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OSCOLA Formatted Reference:
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <code className="text-sm text-gray-800">{reference.formatted}</code>
                    </div>
                  </div>
                )}

                {/* Lint Messages */}
                {reference.lintMessages && reference.lintMessages.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formatting Suggestions:
                    </label>
                    <div className="space-y-1">
                      {reference.lintMessages.map((message, msgIndex) => (
                        <div key={msgIndex} className="flex items-start space-x-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-amber-800">{message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Reference Button */}
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={addReference}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Reference</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OSCOLA Guidelines */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">OSCOLA Formatting Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cases: <em>Case Name</em> [Year] Citation (Court) [Paragraph] (Judge)</li>
            <li>• Statutes: Statute Name Year c Chapter, s Section(subsection)</li>
            <li>• Books: Author, <em>Title</em> (Edition, Publisher Year) Pages</li>
            <li>• Articles: Author, 'Title' (Year) Volume Journal(Issue) Pages</li>
            <li>• Websites: Author, 'Title' (Website, accessed Date) &lt;URL&gt;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
