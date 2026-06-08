// Control page module (Webcam, Power)
import { getElementById } from '../utils/dom.js';
import { emitCommand } from '../lib/socket.js';
import { getTargetMachine } from '../components/machine-selector.js';
import { addAuditRow } from '../utils/audit.js';

export const handleWebcamTrigger = (isOn) => {
  const targetMachine = getTargetMachine();
  if (!targetMachine) return alert("Chưa chọn máy trạm!");
  
  const box = getElementById('webcam-display-box');
  if (!box) return;
  
  if (isOn) {
    box.innerHTML = `<div style="color:var(--success);font-weight:600;text-align:center;"><i class="ti ti-camera" style="font-size:40px;margin-bottom:8px;color:var(--primary)"></i><div>Đang gửi yêu cầu Consent xuống máy trạm...</div></div>`;
    emitCommand('WEBCAM_START', targetMachine);
  } else {
    box.innerHTML = `<div style="text-align:center;color:var(--text-muted)"><i class="ti ti-camera-off" style="font-size:40px;margin-bottom:8px"></i><div>Webcam đã tắt thành công</div></div>`;
    emitCommand('WEBCAM_STOP', targetMachine);
  }
};

export const handlePowerCommand = (type) => {
  const targetMachine = getTargetMachine();
  if (!targetMachine) return alert("Chưa chọn máy trạm!");
  
  const check = confirm(`CẢNH BÁO: Bạn có chắc chắn gửi lệnh mạng [${type}] tới máy ${targetMachine} không? Tất cả dữ liệu chưa lưu của sinh viên sẽ bị mất.`);
  if (check) {
    emitCommand(type, targetMachine);
    addAuditRow(type, targetMachine, 'Đã bắn lệnh hủy nguồn');
  }
};

let klCapturing = true;

export const toggleKeyloggerState = () => {
  klCapturing = !klCapturing;
  const btn = getElementById('btn-toggle-kl');
  if (btn) btn.textContent = klCapturing ? "Tạm dừng bắt phím" : "Tiếp tục bắt phím";
};

export const clearKeyloggerArea = () => {
  const area = getElementById('key-stream-area');
  if (area) area.innerHTML = `<div style="color:var(--text-muted);font-style:italic">Dữ liệu log phím tạm thời trống...</div>`;
};

export default { 
  handleWebcamTrigger, 
  handlePowerCommand, 
  toggleKeyloggerState, 
  clearKeyloggerArea 
};
