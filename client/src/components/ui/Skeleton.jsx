/**
 * Skeleton - Loading skeleton components
 * @param {object} props
 * @param {'text'|'circle'|'rect'|'card'} props.variant
 * @param {string|number} props.width
 * @param {string|number} props.height
 * @param {number} props.count - Number of skeleton items to render
 * @param {string} props.className
 */
const Skeleton = ({ variant = 'text', width, height, count = 1, className = '' }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-dark-100 rounded';

  const variantStyles = {
    text: `${baseClasses} h-4 rounded-md`,
    circle: `${baseClasses} rounded-full`,
    rect: `${baseClasses} rounded-xl`,
    card: `${baseClasses} rounded-2xl`,
  };

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`${variantStyles[variant]} ${className}`}
          style={{
            width: width || (variant === 'circle' ? 40 : '100%'),
            height:
              height ||
              (variant === 'text' ? 16 : variant === 'circle' ? 40 : variant === 'card' ? 200 : 80),
            ...(count > 1 && variant === 'text' && i === count - 1 ? { width: '75%' } : {}),
          }}
        />
      ))}
    </>
  );
};

/**
 * SkeletonCard - Full card skeleton for loading states
 */
export const SkeletonCard = ({ className = '' }) => (
  <div
    className={`rounded-2xl bg-white/80 dark:bg-dark-50/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 p-6 ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circle" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={16} className="mb-2" />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
    <Skeleton variant="text" count={3} className="mb-2" />
  </div>
);

/**
 * SkeletonTable - Table loading skeleton
 */
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" height={14} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, row) => (
      <div
        key={row}
        className="grid gap-4 py-3 border-t border-gray-100 dark:border-white/5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, col) => (
          <Skeleton key={col} variant="text" height={14} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
