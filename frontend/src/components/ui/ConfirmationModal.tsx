import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDarkTheme?: boolean;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDarkTheme = false,
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} isDarkTheme={isDarkTheme}>
      <div className="space-y-4">
        <div className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
          {message}
        </div>
        
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : isDarkTheme
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : isDarkTheme
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
