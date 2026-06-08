// Socket.io client wrapper
import { APP_CONFIG } from '../config/app.config.js';

let socketInstance = null;

export const initSocket = () => {
  if (!socketInstance) {
    socketInstance = io(APP_CONFIG.socketUrl);
    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
    });
  }
  return socketInstance;
};

export const getSocket = () => socketInstance || initSocket();

export const emitCommand = (action, target, detail = null) => {
  const socket = getSocket();
  socket.emit('client_command', { action, target, detail });
};

export default { initSocket, getSocket, emitCommand };
