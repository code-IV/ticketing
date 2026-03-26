import React from 'react';
import Modal from './Modal';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
  isDarkTheme?: boolean;
}

const ValidationModal: React.FC<ValidationModalProps> = ({ 
  isOpen, 
  onClose, 
  errors, 
  isDarkTheme = false 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Validation Errors" isDarkTheme={isDarkTheme}>
      <div className="space-y-3">
        <div className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
          Please fix the following errors before continuing:
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2">
          {errors.map((error, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 p-3 rounded-lg ${
                isDarkTheme ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
              }`}
            >
              <svg className={`w-5 h-5 mt-0.5 shrink-0 ${
                isDarkTheme ? 'text-red-400' : 'text-red-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-sm ${isDarkTheme ? 'text-red-300' : 'text-red-700'}`}>
                {error}
              </span>
            </div>
          ))}
        </div>
        
        <div className="pt-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkTheme
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ValidationModal;
