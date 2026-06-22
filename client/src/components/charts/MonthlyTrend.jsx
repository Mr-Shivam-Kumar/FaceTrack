import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Card from '../ui/Card';
import { FiBarChart2 } from 'react-icons/fi';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-dark-50/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
};

/**
 * MonthlyTrend - Area chart for monthly attendance percentage
 * @param {object} props
 * @param {Array} props.data - [{ month, attendance, target }]
 */
const MonthlyTrend = ({ data = [] }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const chartData = data.length > 0
    ? data
    : months.map((month) => ({
        month,
        attendance: Math.floor(Math.random() * 15) + 80,
        target: 85,
      }));

  return (
    <Card title="Monthly Trend" icon={<FiBarChart2 className="w-5 h-5" />}>
      <div className="h-72 mt-4">
        <ResponsiveContainer width="99%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              domain={[60, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorTarget)"
            />
            <Area
              type="monotone"
              dataKey="attendance"
              name="Attendance"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#colorAttendance)"
              activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default MonthlyTrend;
