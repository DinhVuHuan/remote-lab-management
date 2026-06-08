// Machine selector component
import { getElementById, updateElement } from '../utils/dom.js';

let currentOnlineList = new Set();
let targetMachine = "";

export const getCurrentOnlineList = () => currentOnlineList;
export const getTargetMachine = () => targetMachine;
export const setTargetMachine = (machine) => { targetMachine = machine; };

export const addMachineOnline = (machine) => {
  if (!currentOnlineList.has(machine)) {
    currentOnlineList.add(machine);
    updateMachineDropdown();
  }
};

export const removeMachineOffline = (machine) => {
  currentOnlineList.delete(machine);
  if (targetMachine === machine) {
    targetMachine = "";
  }
  updateMachineDropdown();
};

export const updateMachineDropdown = () => {
  const select = getElementById('machine-select');
  if (!select) return;
  
  const savedTarget = targetMachine;
  select.innerHTML = "";
  
  if (currentOnlineList.size === 0) {
    select.innerHTML = '<option value="">-- Trống (Offline) --</option>';
    updateStatusPill(false);
    return;
  }

  currentOnlineList.forEach(machine => {
    const opt = document.createElement('option');
    opt.value = machine;
    opt.textContent = machine;
    select.appendChild(opt);
  });

  if (currentOnlineList.has(savedTarget)) {
    select.value = savedTarget;
  } else {
    select.value = Array.from(currentOnlineList)[0];
    targetMachine = select.value;
  }
  
  updateElement('total-online-machines-lbl', currentOnlineList.size);
  updateStatusPill(true);
};

export const onTargetMachineChange = () => {
  const select = getElementById('machine-select');
  targetMachine = select.value;
  
  const tbody = getElementById('process-table-body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Đang nạp luồng tiến trình thời gian thực của máy [${targetMachine}]...</td></tr>`;
  }
  
  updateElement('sidebar-proc-badge', "0");
  updateElement('total-procs-lbl', "0");
  updateStatusPill(!!targetMachine);
};

export const updateStatusPill = (isOnline) => {
  const pill = getElementById('global-status-pill');
  if (!pill) return;
  
  if (isOnline) {
    pill.className = "status-pill";
    pill.innerHTML = `<div class="blink"></div>Đang khiển: ${targetMachine}`;
  } else {
    pill.className = "status-pill offline";
    pill.innerHTML = `<div class="blink"></div>Không có thiết bị kết nối`;
  }
};

export default {
  getCurrentOnlineList,
  getTargetMachine,
  setTargetMachine,
  addMachineOnline,
  removeMachineOffline,
  updateMachineDropdown,
  onTargetMachineChange,
  updateStatusPill
};
