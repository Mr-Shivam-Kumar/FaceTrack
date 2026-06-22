import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

/**
 * DataTable - Full-featured data table with search, sort, and pagination
 * @param {object} props
 * @param {Array<{key,label,sortable?,render?,width?}>} props.columns
 * @param {Array} props.data
 * @param {boolean} props.searchable
 * @param {boolean} props.pagination
 * @param {boolean} props.loading
 * @param {string} props.searchPlaceholder
 * @param {number} props.pageSize
 * @param {React.ReactNode} props.headerActions - Extra actions in header
 * @param {Function} props.onRowClick
 */
const DataTable = ({
  columns = [],
  data = [],
  searchable = true,
  pagination = true,
  loading = false,
  searchPlaceholder = 'Search...',
  pageSize: initialPageSize = 10,
  headerActions,
  onRowClick,
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val && String(val).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, search, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/80 dark:bg-dark-50/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 overflow-hidden">
        <div className="p-4 space-y-4">
          <Skeleton variant="rect" height={40} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rect" height={48} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-dark-50/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 overflow-hidden">
      {/* Header */}
      {(searchable || headerActions) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-200/50 dark:border-white/5">
          {searchable && (
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-dark-100 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/50 dark:border-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : {}}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                    col.sortable !== false ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''
                  }`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable !== false && sortKey === col.key && (
                      <span className="text-primary-400">
                        {sortDir === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title="No results found"
                    description={search ? `No results matching "${search}"` : 'No data available'}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <motion.tr
                  key={row._id || row.id || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    border-b border-gray-100/50 dark:border-white/5 last:border-b-0
                    hover:bg-gray-50 dark:hover:bg-dark-100/50
                    transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {col.render ? col.render(row, row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-dark-100 border border-gray-200 dark:border-white/10 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}/page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
