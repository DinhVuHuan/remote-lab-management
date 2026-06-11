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
    if (window.logAction) {
      window.logAction('SCREENSHOT', 'Yêu cầu chụp màn hình');
    } else {
      emitCommand('SCREENSHOT', targetMachine);
    }
  } else if (type === 'LIVE') {
    display.innerHTML = `<div class="live-badge"><div class="blink"></div>LIVE VIEWING - 30 FPS</div>`;
    if (stopBtn) stopBtn.disabled = false;

    if (window.logAction) {
      window.logAction('START_STREAM', 'Bật stream màn hình mượt mà');
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

// Hàm xử lý dữ liệu hình ảnh nhận liên tục từ Socket server (Tối ưu hóa tránh đơ DOM)
export const handleScreenData = (data) => {
  const targetMachine = getTargetMachine();

  // Chỉ xử lý cập nhật nếu dữ liệu trả về đúng định danh máy đang chọn ở tab hiện tại
  if (data.machine_name === targetMachine) {
    const display = getElementById('screen-display-area');
    if (!display) return;

    // Kiểm tra xem cấu trúc thẻ img cố định đã được khởi tạo bên trong vùng hiển thị chưa
    let img = display.querySelector('img#live-screen-img');

    if (!img) {
      // Nếu chưa có, tiến hành xóa sạch giao diện cũ và tạo duy nhất 1 thẻ img cố định
      display.innerHTML = `<img id="live-screen-img" alt="Remote Screen" style="width:100%; height:auto; object-fit:contain; border-radius:4px;" />`;
      img = display.querySelector('img#live-screen-img');
    }

    // ĐÈ TRỰC TIẾP LÊN THUỘC TÍNH SRC: Kỹ thuật giúp cập nhật 30 FPS mượt mà
    img.src = data.image_base64;
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