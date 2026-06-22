/**
 * Badge - Status badge component
 * @param {object} props
 * @param {'success'|'warning'|'danger'|'info'|'neutral'} props.color
 * @param {'solid'|'outline'|'dot'} props.variant
 * @param {'sm'|'md'} props.size
 * @param {string} props.className
 * @param {React.ReactNode} props.children
 */
const colorStyles = {
  success: {
    solid: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    outline: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-400',
  },
  warning: {
    solid: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    outline: 'border-amber-500/50 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-400',
  },
  danger: {
    solid: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    outline: 'border-red-500/50 text-red-600 dark:text-red-400',
    dot: 'bg-red-400',
  },
  info: {
    solid: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    outline: 'border-blue-500/50 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-400',
  },
  neutral: {
    solid: 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
    outline: 'border-gray-500/50 text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

const Badge = ({
  color = 'neutral',
  variant = 'solid',
  size = 'md',
  className = '',
  children,
}) => {
  const colors = colorStyles[color] || colorStyles.neutral;

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${sizeStyles[size]} font-medium ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        <span className="text-gray-700 dark:text-gray-300">{children}</span>
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full
        border
        ${colors[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
