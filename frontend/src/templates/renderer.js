// Template renderer
import { sidebarTemplate } from './sidebar.js';
import { topbarTemplate } from './topbar.js';
import {
  dashboardPanel,
  appsPanel,
  processPanel,
  screenPanel,
  keylogPanel,
  filePanel,
  webcamPanel,
  powerPanel
} from './panels.js';

export const renderApp = () => {
  const appContainer = document.querySelector('.app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }

  // Render sidebar
  const sidebarDiv = document.createElement('div');
  sidebarDiv.innerHTML = sidebarTemplate;
  appContainer.appendChild(sidebarDiv.firstElementChild);

  // Render main content
  const mainDiv = document.createElement('main');
  mainDiv.className = 'main';
  
  // Topbar
  mainDiv.innerHTML = topbarTemplate;
  
  // Content area with panels
  const contentArea = document.createElement('div');
  contentArea.className = 'content-area';
  contentArea.innerHTML = `
    ${dashboardPanel}
    ${appsPanel}
    ${processPanel}
    ${screenPanel}
    ${keylogPanel}
    ${filePanel}
    ${webcamPanel}
    ${powerPanel}
  `;
  
  mainDiv.appendChild(contentArea);
  appContainer.appendChild(mainDiv);
};

export default renderApp;
