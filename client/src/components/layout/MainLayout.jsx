import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 80 : 280 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="flex flex-col min-h-screen transform-gpu"
      >
        <Header />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="transform-gpu will-change-transform"
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
