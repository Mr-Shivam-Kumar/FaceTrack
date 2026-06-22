import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area } from 'recharts';
import Card from '../ui/Card';
import { FiTrendingUp } from 'react-icons/fi';

/**
 * AttendanceTrend - Interactive line chart for daily attendance trends
 * @param {object} props
 * @param {Array} props.data - [{ date, count, percentage }]
 * @param {string} props.title
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-dark-50/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{entry.name === 'Attendance %' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

const AttendanceTrend = ({ data = [], title = 'Attendance Trend' }) => {
  // Generate sample data if none provided
  const chartData = data.length > 0
    ? data
    : Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: Math.floor(Math.random() * 50) + 150,
          percentage: Math.floor(Math.random() * 20) + 75,
        };
      });

  return (
    <Card title={title} icon={<FiTrendingUp className="w-5 h-5" />}>
      <div className="h-72 mt-4">
        <ResponsiveContainer width="99%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              fill="url(#colorTrend)"
              stroke="transparent"
            />
            <Line
              type="monotone"
              dataKey="count"
              name="Students Present"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AttendanceTrend;
