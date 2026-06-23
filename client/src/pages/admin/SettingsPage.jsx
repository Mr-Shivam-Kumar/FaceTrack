import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { HiOutlineCog6Tooth, HiOutlinePaintBrush, HiOutlineShieldCheck, HiOutlineCpuChip } from 'react-icons/hi2';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    recognitionThreshold: 0.6,
    minAttendance: 75,
    sessionTimeout: 60,
    enableAntiSpoofing: true,
    enableNotifications: true,
    autoEndSession: true,
  });

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 transform-gpu will-change-transform"
    >
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500 text-sm mt-1">Configure system preferences</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recognition Settings */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineCpuChip className="text-primary-400" /> Face Recognition</h3>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Recognition Threshold: {settings.recognitionThreshold}</label>
            <input type="range" min="0.3" max="0.9" step="0.05" value={settings.recognitionThreshold}
              onChange={(e) => setSettings({...settings, recognitionThreshold: parseFloat(e.target.value)})}
              className="w-full accent-primary-500" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1"><span>Strict (0.3)</span><span>Lenient (0.9)</span></div>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Anti-Spoofing</p><p className="text-xs text-gray-500">Enable blink detection</p></div>
            <button onClick={() => setSettings({...settings, enableAntiSpoofing: !settings.enableAntiSpoofing})}
              className={`w-11 h-6 rounded-full transition-colors ${settings.enableAntiSpoofing ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.enableAntiSpoofing ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Attendance Settings */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineShieldCheck className="text-primary-400" /> Attendance</h3>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Minimum Attendance: {settings.minAttendance}%</label>
            <input type="range" min="50" max="100" step="5" value={settings.minAttendance}
              onChange={(e) => setSettings({...settings, minAttendance: parseInt(e.target.value)})}
              className="w-full accent-primary-500" />
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Session Timeout (minutes)</label>
            <input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              className="input-field" min={10} max={180} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Auto-end Sessions</p><p className="text-xs text-gray-500">End after timeout</p></div>
            <button onClick={() => setSettings({...settings, autoEndSession: !settings.autoEndSession})}
              className={`w-11 h-6 rounded-full transition-colors ${settings.autoEndSession ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.autoEndSession ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlinePaintBrush className="text-primary-400" /> Appearance</h3>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Dark Mode</p><p className="text-xs text-gray-500">Toggle dark/light theme</p></div>
            <button onClick={toggleTheme}
              className={`w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-800 dark:text-gray-300 font-medium">Notifications</p><p className="text-xs text-gray-500">Enable system notifications</p></div>
            <button onClick={() => setSettings({...settings, enableNotifications: !settings.enableNotifications})}
              className={`w-11 h-6 rounded-full transition-colors ${settings.enableNotifications ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.enableNotifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineCog6Tooth className="text-primary-400" /> System Info</h3>
          <div className="space-y-3 text-sm">
            {[
              ['Version', '1.0.0'],
              ['Face API', '@vladmandic/face-api v1.7'],
              ['Database', 'MongoDB Local'],
              ['Server', 'Express.js'],
              ['Frontend', 'React + Vite'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{k}</span><span className="text-gray-800 dark:text-gray-300 font-medium">{v}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </motion.div>
  );
}
