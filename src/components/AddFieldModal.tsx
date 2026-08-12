import React, { useState } from 'react';
import { X, Columns, Check, AlertCircle } from 'lucide-react';

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddField: (fieldName: string) => void;
  existingHeaders: string[];
}

export const AddFieldModal: React.FC<AddFieldModalProps> = ({
  isOpen,
  onClose,
  onAddField,
  existingHeaders,
}) => {
  const [fieldName, setFieldName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fieldName.trim();
    if (!cleanName) {
      setError('Please enter a column heading name');
      return;
    }
    if (
      existingHeaders.some(
        (h) => h.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      setError('This column heading already exists');
      return;
    }

    onAddField(cleanName);
    setFieldName('');
    setError('');
    onClose();
  };

  const sampleFields = [
    'Budget (INR)',
    'Assigned Sales Rep',
    'Design Preference',
    'Site Inspection Date',
    'Quotation Value',
    'Customer Remarks',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Add New Table Column
              </h3>
              <p className="text-xs text-zinc-500">
                Appends a new heading to Row 1 of your Google Sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Column Heading Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Budget (INR) or Site Visit Date"
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value);
                setError('');
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            {error && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-500 font-semibold block">
              Or pick a suggested sales field:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleFields.map((sample) => (
                <button
                  type="button"
                  key={sample}
                  onClick={() => {
                    setFieldName(sample);
                    setError('');
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
                >
                  + {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Add to Table & Sheet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
