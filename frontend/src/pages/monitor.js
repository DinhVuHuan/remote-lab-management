// Screen page module
import { getElementById } from '../utils/dom.js';
import { emitCommand } from '../lib/socket.js';
import { getTargetMachine, addMachineOnline } from '../components/machine-selector.js';

export const handleScreenTrigger = (type) => {
  const targetMachine = getTargetMachine();
  if (!targetMachine) return alert("Chưa chọn máy trạm!");
  
  const display = getElementById('screen-display-area');
  const stopBtn = getElementById('btn-stop-screen');
  if (!display) return;

  if (type === 'STATIC') {
    display.innerHTML = `<i class="ti ti-device-desktop" style="font-size:48px;color:var(--success)"></i><span style="color:var(--success);font-weight:600">Đang chụp ảnh màn hình...</span>`;
    emitCommand('SCREENSHOT', targetMachine);
  } else if (type === 'LIVE') {
    display.innerHTML = `<div class="live-badge"><div class="blink"></div>LIVE VIEWING - 1 FPS</div>`;
    if (stopBtn) stopBtn.disabled = false;
    emitCommand('START_STREAM', targetMachine);
  } else {
    display.innerHTML = `<i class="ti ti-device-desktop" style="font-size:48px;color:var(--text-muted)"></i><span style="color:var(--text-muted)">Đã ngừng luồng phát nhận dữ liệu</span>`;
    if (stopBtn) stopBtn.disabled = true;
    emitCommand('STOP_STREAM', targetMachine);
  }
};

export const handleProcesses = (data) => {
  const targetMachine = getTargetMachine();
  addMachineOnline(data.machine_name);
  
  if (data.machine_name === targetMachine) {
    const tbody = getElementById('process-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    data.processes.forEach(proc => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${proc.pid}</td>
        <td><strong>${proc.name}</strong></td>
        <td style="color:var(--warning)">${proc.cpu}</td>
        <td>${proc.ram}</td>
        <td>
          <button class="btn danger" onclick="window.handleKillProcess('${proc.pid}', '${proc.name}')">Kill</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    const procBadge = getElementById('sidebar-proc-badge');
    const procLabel = getElementById('total-procs-lbl');
    if (procBadge) procBadge.textContent = data.processes.length;
    if (procLabel) procLabel.textContent = data.processes.length;
  }
};

export default { handleScreenTrigger, handleProcesses };
