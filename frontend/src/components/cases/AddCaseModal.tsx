import React, { useState, ChangeEvent } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

export default function AddCaseModal({ isOpen, onClose, onSubmit }: AddCaseModalProps) {
  const [formData, setFormData] = useState({
    source: '',
    type: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'wav') {
        setAudioFile(file);
      } else {
        toast('Please upload only .wav files.');
        e.target.value = ''; // Reset file input
      }
    }
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create FormData to send both file and text fields
    const submitFormData = new FormData();
    
    // Append text fields
    submitFormData.append('source', formData.source);
    submitFormData.append('type', formData.type);
    // Append audio file if exists
    if (audioFile) {
      submitFormData.append('wavFile', audioFile);
    }

    // Call onSubmit with FormData
    onSubmit(submitFormData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Case</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Source
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Case Type
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Audio File
            </label>
            <input
              type="file"
              accept=".wav"
              onChange={handleFileChange}
              className="mt-1 block w-full"
              required
            />
            {audioFile && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {audioFile.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Case</span>
          </button>
        </form>
      </div>
    </div>
  );
}