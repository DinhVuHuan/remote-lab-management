// Main application entry point
import renderApp from './templates/renderer.js';
import { initSocket, getSocket } from './lib/socket.js';
import { switchPanel, getElementById } from './utils/dom.js';
import { addAuditRow, logSystemEvent } from './utils/audit.js';
import { 
  onTargetMachineChange, 
  updateMachineDropdown,
  addMachineOnline,
  removeMachineOffline,
  getTargetMachine
} from './components/machine-selector.js';
import { 
  handleScreenTrigger, 
  handleProcesses 
} from './pages/monitor.js';
import { 
  handleWebcamTrigger, 
  handlePowerCommand, 
  toggleKeyloggerState, 
  clearKeyloggerArea 
} from './pages/control.js';

// Render app
renderApp();

// Initialize
const socket = initSocket();

// Socket event listeners
socket.on('connect', () => {
  console.log("✅ Trình duyệt Web Control Panel kết nối thành công tới Server!");
});

socket.on('server_send_procs_to_web', (data) => {
  handleProcesses(data);
});

socket.on('server_send_audit_to_web', (data) => {
  console.log("Nhận log trạng thái máy trạm:", data);
  
  const isOnline = data.action === 'AGENT_ONLINE' ? true : 
                   data.action === 'AGENT_OFFLINE' ? false : null;
  
  logSystemEvent(data.action, data.machine_name, data.status, isOnline);
  
  if (isOnline === true) {
    addMachineOnline(data.machine_name);
  } else if (isOnline === false) {
    removeMachineOffline(data.machine_name);
  }
});

// Global functions for inline onclick handlers
window.switchPanel = switchPanel;
window.onTargetMachineChange = onTargetMachineChange;
window.triggerScreen = handleScreenTrigger;
window.triggerWebcam = handleWebcamTrigger;
window.toggleKlState = toggleKeyloggerState;
window.clearKlArea = clearKeyloggerArea;
window.triggerPower = handlePowerCommand;

window.logAction = (actionType, targetName) => {
  const targetMachine = getTargetMachine();
  if (!targetMachine) {
    alert("LỖI: Vui lòng chọn hoặc chờ thiết bị Agent kết nối trước khi ra lệnh!");
    return;
  }
  console.log(`Đang phát lệnh: ${actionType} -> ${targetName} trên máy ${targetMachine}`);
  socket.emit('client_command', { action: actionType, target: targetMachine, detail: targetName });
  addAuditRow(actionType, targetMachine, 'Đã chuyển tiếp qua Socket');
};

window.handleKillProcess = (pid, name) => {
  logAction('KILL_PROCESS', `PID ${pid} (${name})`);
};

console.log('✨ Remote Lab Management - Initialized');
