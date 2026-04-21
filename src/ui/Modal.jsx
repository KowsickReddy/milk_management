import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';

// Modal Overlay
export function ModalOverlay({ onClick }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
      onClick={onClick}
    />
  );
}

// Modal Content
export function ModalContent({ children, className, size = 'md', onClose }) {
  const modalRef = useRef(null);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full animate-scale-in',
          'max-h-[90vh] overflow-y-auto',
          sizes[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Modal Header
export function ModalHeader({ children, className, onClose }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-gray-100',
        className
      )}
    >
      <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
      {onClose && (
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Modal Body
export function ModalBody({ children, className }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

// Modal Footer
export function ModalFooter({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

// Complete Modal
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  if (!isOpen) return null;

  return (
    <ModalContent size={size} onClose={onClose}>
      <ModalHeader onClose={onClose}>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </ModalContent>
  );
}

// Confirm Modal
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <ModalBody>
        <p className="text-gray-600">{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default Modal;
