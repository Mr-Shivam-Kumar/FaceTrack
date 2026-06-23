import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

/**
 * StatCard - KPI metric card for dashboards
 * @param {object} props
 * @param {string} props.title - Metric name
 * @param {number|string} props.value - Metric value
 * @param {string} props.change - Change text (e.g., "+12%")
 * @param {'positive'|'negative'|'neutral'} props.changeType
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.color - Color theme: blue, purple, green, red, cyan, amber, indigo, emerald
 * @param {string} props.suffix - Value suffix (e.g., "%")
 * @param {number} props.index - For stagger animation delay
 */
const colorMap = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/10',
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/10',
  },
  green: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/10',
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-500/10',
  },
  amber: {
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/10',
  },
  indigo: {
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
    glow: 'shadow-indigo-500/10',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
  },
};

const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue',
  suffix = '',
  index = 0,
}) => {
  const colors = colorMap[color] || colorMap.blue;
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;

  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(numValue);
  }, [numValue, spring]);

  const changeColor = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  const changeArrow = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`
        relative overflow-hidden rounded-2xl p-6
        bg-white/80 dark:bg-dark-50/80
        backdrop-blur-xl
        border border-gray-200/50 dark:border-white/5
        shadow-lg ${colors.glow}
        hover:shadow-xl hover:border-primary-500/20 dark:hover:border-white/10
        transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] duration-300
        transform-gpu will-change-transform
        group
      `}
    >
      {/* Background glow effect */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${colors.bg} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} text-white shadow-lg ${colors.glow}`}
          >
            {icon}
          </div>
          {change && (
            <span className={`text-sm font-medium ${changeColor[changeType]} flex items-center gap-1`}>
              {changeArrow[changeType]} {change}
            </span>
          )}
        </div>

        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <motion.span className="text-3xl font-bold text-gray-900 dark:text-white">
              {display}
            </motion.span>
            {suffix && (
              <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                {suffix}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{title}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
