import React, { useState } from 'react';
import { createExpenseFromImage } from '../api/client';
import { usePersonName } from '../hooks/usePersonName';

interface ReceiptUploadProps {
  onExpenseCreated: (slug: string) => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ onExpenseCreated }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [payerName, setPayerName] = usePersonName();
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !payerName.trim()) return;

    setIsUploading(true);
    setError(null);
    
    try {
      const newExpense = await createExpenseFromImage(file, payerName.trim());
      onExpenseCreated(newExpense.slug || newExpense.id);
    } catch (error: any) {
      console.error('Failed to create expense:', error);
      setError(error.message || 'Failed to process receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">Fork the Bill</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="payerName" className="block text-sm font-medium text-gray-700 mb-2">
            Who paid the bill?
          </label>
          <input
            type="text"
            id="payerName"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
            required
            disabled={isUploading}
          />
        </div>

        <div>
          <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
            Upload Receipt
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
            <input
              type="file"
              id="receipt"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={!payerName.trim() || isUploading}
            />
            <label
              htmlFor="receipt"
              className={`cursor-pointer block ${
                !payerName.trim() || isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="text-gray-600">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
                    <div className="text-center">
                      <p className="font-medium">Processing receipt...</p>
                      <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm font-medium">Click to upload receipt image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
                    <p className="text-xs text-gray-400 mt-2">Or drag and drop here</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {!payerName.trim() && (
          <p className="text-sm text-red-600 text-center">Please enter your name first</p>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptUpload; 