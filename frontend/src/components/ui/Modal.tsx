import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isDarkTheme?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  isDarkTheme = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
        isDarkTheme ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDarkTheme ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDarkTheme 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Modal;
