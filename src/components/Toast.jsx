import React, { useState, useEffect } from 'react';

const icons = {
  success: (
    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const iconMap = {
    success: icons.success,
    error: icons.error,
    warning: icons.warning,
    info: icons.info,
  };

  const bgColors = {
    success: 'bg-primary-50',
    error: 'bg-red-50',
    warning: 'bg-amber-50',
    info: 'bg-secondary-50',
  };

  return (
    <div className={`toast ${bgColors[type]}`}>
      {iconMap[type]}
      <span className="text-sm font-medium text-gray-900">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-gray-200">
        {icons.close}
      </button>
    </div>
  );
}

// Toast context for global toast notifications
let toastCallback = null;

export function showToast(message, type = 'success') {
  if (toastCallback) {
    toastCallback(message, type);
  }
}

export function ToastContainer({ setToast }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastCallback = (message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
    };
    return () => {
      toastCallback = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;