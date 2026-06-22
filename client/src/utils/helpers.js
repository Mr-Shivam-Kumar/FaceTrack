// ─── Date & Time Formatting ──────────────────────────────────────────────────

/**
 * Format a date string to readable format
 * @param {string|Date} date
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  const d = new Date(date);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return d.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format time to 12-hour format
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date and time together
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string|Date} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  if (!date) return '—';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return `${diffMonth}mo ago`;
};

// ─── String Helpers ──────────────────────────────────────────────────────────

/**
 * Get initials from a full name
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate string with ellipsis
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (str, maxLength = 30) => {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength) + '…';
};

// ─── Attendance Helpers ──────────────────────────────────────────────────────

/**
 * Get color class based on attendance percentage
 * @param {number} percentage
 * @returns {string} Tailwind color class
 */
export const getAttendanceColor = (percentage) => {
  if (percentage >= 90) return 'text-emerald-400';
  if (percentage >= 75) return 'text-green-400';
  if (percentage >= 60) return 'text-yellow-400';
  if (percentage >= 40) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Get background color for attendance
 * @param {number} percentage
 * @returns {string}
 */
export const getAttendanceBgColor = (percentage) => {
  if (percentage >= 90) return 'bg-emerald-500/20 text-emerald-400';
  if (percentage >= 75) return 'bg-green-500/20 text-green-400';
  if (percentage >= 60) return 'bg-yellow-500/20 text-yellow-400';
  if (percentage >= 40) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
};

/**
 * Get status badge colors
 * @param {string} status - 'present' | 'absent' | 'late'
 * @returns {object} { bg, text }
 */
export const getStatusColors = (status) => {
  const map = {
    present: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    absent: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
    late: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    excused: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  };
  return map[status] || map.absent;
};

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Debounce function execution
 * @param {Function} fn
 * @param {number} delay - milliseconds
 * @returns {Function}
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Download file from blob or URL
 * @param {Blob|string} data
 * @param {string} filename
 * @param {string} mimeType
 */
export const downloadFile = (data, filename, mimeType = 'application/octet-stream') => {
  let blob;
  if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([data], { type: mimeType });
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate random ID
 * @param {number} length
 * @returns {string}
 */
export const generateId = (length = 8) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

/**
 * Format number with commas
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
};

/**
 * Calculate percentage
 * @param {number} part
 * @param {number} total
 * @returns {number}
 */
export const calcPercentage = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Clamp a number between min and max
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * Sleep for ms
 * @param {number} ms
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get ordinal suffix (1st, 2nd, 3rd, etc.)
 * @param {number} n
 * @returns {string}
 */
export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Alias for backward compat
export const formatTimeAgo = timeAgo;
