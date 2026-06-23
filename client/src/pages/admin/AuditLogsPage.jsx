import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { HiOutlineDocumentText, HiOutlineClock, HiOutlineCommandLine } from 'react-icons/hi2';
import { formatDateTime } from '../../utils/helpers';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Fetch audit logs (requesting a larger limit to list on client)
      const { data } = await api.get('/audit-logs?limit=200');
      setLogs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'success';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'warning';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'danger';
    return 'neutral';
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (row) => (
        <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
          <HiOutlineClock className="text-sm" />
          {formatDateTime(row.timestamp)}
        </div>
      )
    },
    {
      key: 'actor',
      label: 'Actor',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm">{row.actor?.name || 'System / Guest'}</p>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">{row.actorRole}</p>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <Badge color={getActionBadgeColor(row.action)} variant="solid">
          {row.action}
        </Badge>
      )
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (row) => (
        <div>
          <span className="text-gray-800 dark:text-gray-300 font-medium">{row.resource || '—'}</span>
          {row.resourceId && (
            <p className="text-[10px] font-mono text-gray-500 truncate max-w-[120px]" title={row.resourceId}>
              ID: {row.resourceId}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (row) => <span className="font-mono text-xs text-gray-400">{row.ipAddress || '—'}</span>
    },
    {
      key: 'actions',
      label: 'Details',
      sortable: false,
      render: (row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-primary-400 hover:text-white bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/10 transition-all"
        >
          <HiOutlineDocumentText className="text-sm" />
          Inspect
        </button>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 transform-gpu will-change-transform"
    >
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Review system logs, user actions, and modifications</p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchable
        searchPlaceholder="Filter logs by action or actor..."
        pagination
        pageSize={15}
      />

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Log Entry Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5 text-gray-700 dark:text-gray-300">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Event Timestamp</p>
                <p className="font-mono font-medium mt-0.5">{formatDateTime(selectedLog.timestamp)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">IP Address</p>
                <p className="font-mono font-medium mt-0.5">{selectedLog.ipAddress}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Actor Account</p>
                <p className="font-medium mt-0.5">{selectedLog.actor?.name || 'System'} ({selectedLog.actorRole})</p>
                <p className="font-mono text-[10px] text-gray-500">{selectedLog.actor?.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Target Resource</p>
                <p className="font-medium mt-0.5">{selectedLog.resource || '—'}</p>
                {selectedLog.resourceId && (
                  <p className="font-mono text-[10px] text-gray-500">ID: {selectedLog.resourceId}</p>
                )}
              </div>
            </div>

            {/* Changes Payload */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <HiOutlineCommandLine className="text-primary-400" />
                <span>Payload & API Info</span>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/60 p-4 font-mono text-xs overflow-x-auto max-h-[300px]">
                <pre className="text-emerald-700 dark:text-emerald-400">
                  {JSON.stringify(selectedLog.changes || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
