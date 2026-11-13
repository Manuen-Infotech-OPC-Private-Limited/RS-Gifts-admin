import { io } from 'socket.io-client';

let socket = null;

// Determine socket server URL
export const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }
  return 'https://rs-gifts-backend.onrender.com';
};

/**
 * Initialize or get active Socket.IO client instance
 */
export const getSocket = () => {
  if (!socket) {
    const socketUrl = resolveSocketUrl();
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Admin connected to server:', socket.id);
      // Join admin notification room
      socket.emit('join_admin');
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Admin disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.debug('[WebSocket] Connection attempt failed:', error.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.emit('leave_admin');
    socket.disconnect();
    socket = null;
  }
};

