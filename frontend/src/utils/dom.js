// DOM utilities
export const getElementById = (id) => document.getElementById(id);

export const switchPanel = (panelId, element) => {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const targetPanel = getElementById('panel-' + panelId) || getElementById(panelId + '-panel');
  if (targetPanel) targetPanel.classList.add('active');
  if (element) element.classList.add('active');
};

export const updateElement = (id, content) => {
  const el = getElementById(id);
  if (el) el.textContent = content;
};

export const setHTML = (id, html) => {
  const el = getElementById(id);
  if (el) el.innerHTML = html;
};

export const enableButton = (id, enabled = true) => {
  const btn = getElementById(id);
  if (btn) btn.disabled = !enabled;
};

export default { switchPanel, getElementById, updateElement, setHTML, enableButton };
