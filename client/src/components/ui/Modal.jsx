import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

/**
 * Modal - Animated glassmorphism modal
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {'sm'|'md'|'lg'|'xl'|'full'} props.size
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} props.footer
 * @param {boolean} props.closable - Show close button (default true)
 */
const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closable = true,
}) => {
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape' && closable) onClose();
    },
    [onClose, closable]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closable ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`
              relative z-10 w-full ${sizeClasses[size]}
              bg-white dark:bg-dark-50
              backdrop-blur-xl
              rounded-2xl
              border border-gray-200 dark:border-white/10
              shadow-2xl shadow-black/20
              max-h-[90vh] flex flex-col
            `}
          >
            {/* Header */}
            {(title || closable) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                {closable && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-white/10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
