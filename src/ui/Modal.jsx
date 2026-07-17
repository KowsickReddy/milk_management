import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from './Button';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
};

export function ModalOverlay({ onClick }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={overlayVariants}
      onClick={onClick}
    />
  );
}

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
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={overlayVariants}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
        className={cn(
          'relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full',
          'max-h-[90vh] overflow-y-auto',
          'sm:rounded-2xl rounded-t-2xl',
          sizes[size],
          className
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ModalHeader({ children, className, onClose }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-slate-100',
        className
      )}
    >
      <h2 className="text-xl font-semibold text-slate-900">{children}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function ModalFooter({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalContent size={size} onClose={onClose}>
          <ModalHeader onClose={onClose}>{title}</ModalHeader>
          <ModalBody>{children}</ModalBody>
          {footer && <ModalFooter>{footer}</ModalFooter>}
        </ModalContent>
      )}
    </AnimatePresence>
  );
}

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
  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
          <ModalBody>
            <p className="text-slate-600">{message}</p>
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
      )}
    </AnimatePresence>
  );
}

export default Modal;
