import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Card from '../ui/Card';
import { FiActivity } from 'react-icons/fi';

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
 * ForecastChart - Line chart with historical data and predicted trend
 * @param {object} props
 * @param {Array} props.data - [{ month, actual }]
 * @param {number} props.forecastMonths - Number of months to forecast
 */
const ForecastChart = ({ data = [], forecastMonths = 3 }) => {
  const chartData = useMemo(() => {
    const historicalData = data.length > 0
      ? data
      : [
          { month: 'Jan', actual: 82 },
          { month: 'Feb', actual: 85 },
          { month: 'Mar', actual: 79 },
          { month: 'Apr', actual: 88 },
          { month: 'May', actual: 91 },
          { month: 'Jun', actual: 87 },
        ];

    // Simple linear regression for forecast
    const n = historicalData.length;
    const xValues = historicalData.map((_, i) => i);
    const yValues = historicalData.map((d) => d.actual);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, x, i) => a + x * yValues[i], 0);
    const sumX2 = xValues.reduce((a, x) => a + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecastMonthNames = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = historicalData.map((d) => ({
      ...d,
      forecast: null,
    }));

    // Add the last actual point as start of forecast
    result[result.length - 1].forecast = result[result.length - 1].actual;

    for (let i = 0; i < forecastMonths; i++) {
      const forecastVal = Math.round(Math.max(0, Math.min(100, slope * (n + i) + intercept)));
      result.push({
        month: forecastMonthNames[i] || `M+${i + 1}`,
        actual: null,
        forecast: forecastVal,
      });
    }

    return result;
  }, [data, forecastMonths]);

  return (
    <Card title="Attendance Forecast" icon={<FiActivity className="w-5 h-5" />}>
      <div className="h-72 mt-4">
        <ResponsiveContainer width="99%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-primary-500 rounded" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Historical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-amber-500 rounded" style={{ borderTop: '2px dashed #f59e0b' }} />
          <span className="text-xs text-gray-500 dark:text-gray-400">Forecast</span>
        </div>
      </div>
    </Card>
  );
};

export default ForecastChart;
