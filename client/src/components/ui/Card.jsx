import { motion } from 'framer-motion';

/**
 * Card - Glassmorphism card component
 * @param {object} props
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Card subtitle
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.className - Additional classes
 * @param {React.ReactNode} props.children - Card content
 * @param {boolean} props.hoverable - Enable hover animation
 * @param {React.ReactNode} props.headerAction - Action button in header
 * @param {boolean} props.noPadding - Remove padding
 */
const Card = ({
  title,
  subtitle,
  icon,
  className = '',
  children,
  hoverable = false,
  headerAction,
  noPadding = false,
}) => {
  const Wrapper = hoverable ? motion.div : 'div';
  const motionProps = hoverable
    ? {
        whileHover: { scale: 1.01, y: -2 },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <Wrapper
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/80 dark:bg-dark-50/80
        backdrop-blur-xl
        border border-gray-200/50 dark:border-white/5
        shadow-lg shadow-black/5 dark:shadow-black/20
        ${noPadding ? '' : 'p-6'}
        ${hoverable ? 'cursor-pointer hover:border-primary-500/20 dark:hover:border-primary-500/20 hover:shadow-primary-500/5' : ''}
        transition-colors duration-300
        ${className}
      `}
      {...motionProps}
    >
      {(title || subtitle || icon || headerAction) && (
        <div className={`flex items-start justify-between ${noPadding ? 'p-6 pb-0' : 'mb-4'}`}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </Wrapper>
  );
};

export default Card;
