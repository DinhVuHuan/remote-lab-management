// Audit log utilities
import { getElementById, updateElement } from './dom.js';

let totalLogsCount = 0;

export const addAuditRow = (action, machine, status) => {
  const body = getElementById('audit-log-rows');
  if (!body) return;
  
  if (totalLogsCount === 0) {
    body.innerHTML = "";
  }

  const timeStr = new Date().toLocaleTimeString();
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${timeStr}</td>
    <td>teacher@hcmus.edu.vn</td>
    <td><strong>${action}</strong></td>
    <td>${machine}</td>
    <td><span>${status}</span></td>
  `;
  body.insertBefore(row, body.firstChild);

  totalLogsCount++;
  updateElement('total-logs-lbl', totalLogsCount);
};

export const logSystemEvent = (action, machine, status, isOnline = null) => {
  const body = getElementById('audit-log-rows');
  if (!body) return;
  
  if (totalLogsCount === 0) {
    body.innerHTML = "";
  }

  let statusStyle = "";
  if (isOnline === true) {
    statusStyle = `style="color: var(--success); font-weight: bold;"`;
  } else if (isOnline === false) {
    statusStyle = `style="color: var(--danger); font-weight: bold;"`;
  }

  const timeStr = new Date().toLocaleTimeString();
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${timeStr}</td>
    <td>Hệ thống (System)</td>
    <td><strong>${action}</strong></td>
    <td>${machine}</td>
    <td><span ${statusStyle}>${status}</span></td>
  `;
  body.insertBefore(row, body.firstChild);
  
  totalLogsCount++;
  updateElement('total-logs-lbl', totalLogsCount);
};

export const getTotalLogs = () => totalLogsCount;

export default { addAuditRow, logSystemEvent, getTotalLogs };
