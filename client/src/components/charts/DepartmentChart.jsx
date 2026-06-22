import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import Card from '../ui/Card';
import { FiGrid } from 'react-icons/fi';
import { COLORS } from '../../utils/constants';

const barColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-dark-50/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        Attendance: {payload[0].value}%
      </p>
    </div>
  );
};

/**
 * DepartmentChart - Bar chart for department-wise attendance
 * @param {object} props
 * @param {Array} props.data - [{ name, attendance }]
 * @param {boolean} props.horizontal - Use horizontal bars
 */
const DepartmentChart = ({ data = [], horizontal = false }) => {
  const chartData = data.length > 0
    ? data
    : [
        { name: 'CSE', attendance: 92 },
        { name: 'ECE', attendance: 87 },
        { name: 'ME', attendance: 78 },
        { name: 'CE', attendance: 85 },
        { name: 'EEE', attendance: 81 },
        { name: 'IT', attendance: 90 },
      ];

  return (
    <Card title="Department Attendance" icon={<FiGrid className="w-5 h-5" />}>
      <div className="h-72 mt-4">
        <ResponsiveContainer width="99%" height="100%">
          <BarChart
            data={chartData}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 10, left: horizontal ? 40 : -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={50} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.2)' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
            <Bar
              dataKey="attendance"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              animationDuration={800}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={barColors[i % barColors.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default DepartmentChart;
