import { motion } from 'framer-motion';
import { FiInbox } from 'react-icons/fi';

/**
 * EmptyState - Empty state component for no data scenarios
 * @param {object} props
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} props.actionLabel - Action button text
 * @param {Function} props.onAction - Action button handler
 */
const EmptyState = ({
  icon,
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 dark:bg-dark-100 mb-6">
        {icon || <FiInbox className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
