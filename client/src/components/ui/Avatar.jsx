import { getInitials } from '../../utils/helpers';

/**
 * Avatar - User avatar component with fallback initials
 * @param {object} props
 * @param {string} props.src - Image URL
 * @param {string} props.name - Full name for initials fallback
 * @param {'sm'|'md'|'lg'|'xl'} props.size
 * @param {boolean} props.online - Show online status dot
 * @param {string} props.className
 */
const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const dotSizes = {
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-4 h-4 border-2',
};

const Avatar = ({ src, name, size = 'md', online, className = '' }) => {
  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-gray-200 dark:ring-white/10`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold ring-2 ring-gray-200 dark:ring-white/10 ${
          src ? 'hidden' : 'flex'
        }`}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-white dark:border-dark-50 ${
            online ? 'bg-emerald-400' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
};

export default Avatar;
