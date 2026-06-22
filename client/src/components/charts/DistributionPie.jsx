import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Card from '../ui/Card';
import { FiPieChart } from 'react-icons/fi';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-dark-50/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
};

/**
 * DistributionPie - Donut chart for student/attendance distribution
 * @param {object} props
 * @param {Array} props.data - [{ name, value }]
 * @param {string} props.title
 * @param {string} props.centerLabel
 * @param {string|number} props.centerValue
 */
const DistributionPie = ({
  data = [],
  title = 'Student Distribution',
  centerLabel = 'Total',
  centerValue,
}) => {
  const chartData = data.length > 0
    ? data
    : [
        { name: 'CSE', value: 350 },
        { name: 'ECE', value: 280 },
        { name: 'ME', value: 200 },
        { name: 'CE', value: 150 },
        { name: 'EEE', value: 180 },
        { name: 'IT', value: 220 },
      ];

  const total = centerValue || chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card title={title} icon={<FiPieChart className="w-5 h-5" />}>
      <div className="h-72 mt-4 relative">
        <ResponsiveContainer width="99%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationDuration={800}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{centerLabel}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {chartData.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DistributionPie;
