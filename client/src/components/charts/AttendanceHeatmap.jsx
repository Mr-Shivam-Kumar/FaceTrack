import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import { FiCalendar } from 'react-icons/fi';
import { MONTHS } from '../../utils/constants';

/**
 * AttendanceHeatmap - GitHub-style contribution heatmap
 * @param {object} props
 * @param {Array} props.data - [{ date: 'YYYY-MM-DD', count: number }]
 * @param {number} props.weeks - Number of weeks to display (default 52)
 */
const AttendanceHeatmap = ({ data = [], weeks = 52 }) => {
  const [tooltip, setTooltip] = useState(null);

  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7);
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const dataMap = {};
    data.forEach((d) => {
      dataMap[d.date] = d.count;
    });

    const allWeeks = [];
    let currentDate = new Date(startDate);

    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dataMap[dateStr] ?? Math.floor(Math.random() * 10); // sample data if no real data
        week.push({
          date: dateStr,
          count,
          day: currentDate.getDay(),
          month: currentDate.getMonth(),
          displayDate: currentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      allWeeks.push(week);
    }

    return allWeeks;
  }, [data, weeks]);

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-200 dark:bg-dark-200';
    if (count <= 2) return 'bg-emerald-100 dark:bg-emerald-900/50';
    if (count <= 4) return 'bg-emerald-200 dark:bg-emerald-700/60';
    if (count <= 6) return 'bg-emerald-300 dark:bg-emerald-500/70';
    return 'bg-emerald-500 dark:bg-emerald-400';
  };

  // Month labels
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    heatmapData.forEach((week, weekIdx) => {
      const month = week[0].month;
      if (month !== lastMonth) {
        labels.push({ month: MONTHS[month], weekIdx });
        lastMonth = month;
      }
    });
    return labels;
  }, [heatmapData]);

  return (
    <Card title="Attendance Heatmap" icon={<FiCalendar className="w-5 h-5" />}>
      <div className="mt-4 overflow-x-auto">
        {/* Month Labels */}
        <div className="flex ml-8 mb-1">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="text-xs text-gray-500 dark:text-gray-400"
              style={{ marginLeft: i === 0 ? label.weekIdx * 14 : (label.weekIdx - (monthLabels[i - 1]?.weekIdx || 0)) * 14 - 20 }}
            >
              {label.month}
            </div>
          ))}
        </div>

        <div className="flex gap-0.5">
          {/* Day Labels */}
          <div className="flex flex-col gap-0.5 mr-1 pt-0">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => (
              <div key={i} className="h-[12px] text-[10px] text-gray-500 dark:text-gray-400 leading-[12px]">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          {heatmapData.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <motion.div
                  key={di}
                  className={`w-[12px] h-[12px] rounded-sm ${getColor(day.count)} cursor-pointer transition-all hover:ring-1 hover:ring-gray-400 dark:hover:ring-white/30`}
                  onMouseEnter={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                      date: day.displayDate,
                      count: day.count,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  whileHover={{ scale: 1.3 }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-dark-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/50" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-700/60" />
          <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-500/70" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white/95 dark:bg-dark-50/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">{tooltip.date}</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{tooltip.count} attendance(s)</p>
        </div>
      )}
    </Card>
  );
};

export default AttendanceHeatmap;
