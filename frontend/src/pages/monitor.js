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
    display.innerHTML = `
      <i class="ti ti-device-desktop" style="font-size:48px;color:var(--success)"></i>
      <span style="color:var(--success);font-weight:600">Đang chụp ảnh màn hình...</span>
    `;
    // Gọi hàm logAction toàn cục (giống như cách bạn làm với Kill Process)
    if (window.logAction) {
      window.logAction('SCREENSHOT', 'Yêu cầu chụp màn hình');
    } else {
      emitCommand('SCREENSHOT', targetMachine);
    }
  } else if (type === 'LIVE') {
    display.innerHTML = `<div class="live-badge"><div class="blink"></div>LIVE VIEWING - 1 FPS</div>`;
    if (stopBtn) stopBtn.disabled = false;

    if (window.logAction) {
      window.logAction('START_STREAM', 'Bật stream màn hình');
    } else {
      emitCommand('START_STREAM', targetMachine);
    }
  } else {
    display.innerHTML = `
      <i class="ti ti-device-desktop" style="font-size:48px;color:var(--text-muted)"></i>
      <span style="color:var(--text-muted)">Đã ngừng luồng phát nhận dữ liệu</span>
    `;
    if (stopBtn) stopBtn.disabled = true;

    if (window.logAction) {
      window.logAction('STOP_STREAM', 'Tắt stream màn hình');
    } else {
      emitCommand('STOP_STREAM', targetMachine);
    }
  }
};

// Hàm mới: Xử lý dữ liệu hình ảnh nhận được từ Socket server
export const handleScreenData = (data) => {
  const targetMachine = getTargetMachine();

  // Chỉ hiển thị hình ảnh nếu dữ liệu trả về đúng của máy đang chọn
  if (data.machine_name === targetMachine) {
    const display = getElementById('screen-display-area');
    if (!display) return;

    // data.image_base64 là chuỗi dạng "data:image/jpeg;base64,/9j/4AAQ..." từ Agent gửi lên
    display.innerHTML = `
      <img src="${data.image_base64}" alt="Remote Screen" style="width:100%; height:auto; object-fit:contain; border-radius:4px;" />
    `;
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

export default { handleScreenTrigger, handleScreenData, handleProcesses };