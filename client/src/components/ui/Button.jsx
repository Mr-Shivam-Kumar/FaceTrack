import { motion, AnimatePresence } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';

/**
 * Button - Premium button component with multiple variants
 * @param {object} props
 * @param {'primary'|'secondary'|'outline'|'danger'|'ghost'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled
 * @param {React.ReactNode} props.iconLeft - Icon before text
 * @param {React.ReactNode} props.iconRight - Icon after text
 * @param {boolean} props.fullWidth
 * @param {string} props.className
 * @param {React.ReactNode} props.children
 */
const variants = {
  primary:
    'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
  secondary:
    'bg-gray-100 dark:bg-dark-100 hover:bg-gray-200 dark:hover:bg-dark-200 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10',
  outline:
    'border-2 border-primary-500/50 hover:border-primary-500 text-primary-500 hover:bg-primary-500/10',
  danger:
    'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25',
  ghost:
    'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100 hover:text-gray-900 dark:hover:text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  onClick,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      whileHover={!isDisabled ? { scale: 1.015, y: -0.5 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-transparent
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed saturate-50' : 'cursor-pointer'}
        transform-gpu will-change-transform
        ${className}
      `}
      {...rest}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loader"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0"
          >
            <FiLoader className="w-4 h-4 animate-spin text-current" />
          </motion.span>
        ) : (
          iconLeft && (
            <motion.span
              key="icon-left"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="flex-shrink-0"
            >
              {iconLeft}
            </motion.span>
          )
        )}
      </AnimatePresence>
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  );
};

export default Button;
