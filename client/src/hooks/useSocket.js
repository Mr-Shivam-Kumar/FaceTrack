import { useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';

/**
 * useSocket - Hook to access Socket.io connection
 * @returns {{ socket, connected }}
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
