// Modern Dashboard JavaScript
class CoturnDashboard {
constructor() {
this.refreshInterval = 30000; // 30 seconds
this.intervalId = null;
this.init();
}

init() {
console.log('🎛️ Coturn Dashboard initializing...');
this.loadData();
this.startAutoRefresh();
this.setupEventListeners();
}

setupEventListeners() {
// Refresh button
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
refreshBtn.addEventListener('click', () => this.loadData());
}

// Auto-refresh toggle
const autoRefreshToggle = document.getElementById('autoRefresh');
if (autoRefreshToggle) {
autoRefreshToggle.addEventListener('change', (e) => {
if (e.target.checked) {
this.startAutoRefresh();
} else {
this.stopAutoRefresh();
}
});
}
}

async loadData() {
try {
this.showLoading();

const [debug, nodes, services] = await Promise.all([
this.fetchData('/api/debug'),
this.fetchData('/api/nodes'),
this.fetchData('/api/services')
]);

this.updateSystemStatus(debug);
this.updateNodesList(nodes);
this.updateServicesList(services);

this.updateLastRefresh();
console.log('✅ Dashboard data updated');

} catch (error) {
console.error('❌ Error loading dashboard data:', error);
this.showError(error.message);
}
}

async fetchData(endpoint) {
const response = await fetch(endpoint);
if (!response.ok) {
throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
return response.json();
}

showLoading() {
const loadingElements = document.querySelectorAll('.loading-target');
loadingElements.forEach(el => {
el.innerHTML = '<div class="loading">🔄 Loading...</div>';
});
}

showError(message) {
const errorElements = document.querySelectorAll('.loading-target');
errorElements.forEach(el => {
el.innerHTML = `<div class="error" style="color: var(--danger-color); text-align: center; padding: 20px;">❌ Error: ${message}</div>`;
});
}

updateSystemStatus(debug) {
const container = document.getElementById('systemStatus');
if (!container) return;

const html = `
<div class="stats-grid fade-in">
<div class="stat-card">
<span class="stat-number">${debug.totalClients}</span>
<span class="stat-label">Total Clients</span>
</div>
<div class="stat-card">
<span class="stat-number">${debug.totalNodes}</span>
<span class="stat-label">Total Nodes</span>
</div>
<div class="stat-card">
<span class="stat-number">${debug.nodeStatuses.length}</span>
<span class="stat-label">Connected</span>
</div>
</div>
<div class="info-grid" style="margin-top: 20px;">
<div class="info-item">
<span class="info-label">Node IDs:</span>
<span class="info-value">${debug.nodeIds.join(', ') || 'None'}</span>
</div>
</div>
`;

container.innerHTML = html;
}

updateNodesList(nodes) {
const container = document.getElementById('nodesList');
if (!container) return;

if (nodes.length === 0) {
container.innerHTML = '<div class="loading">No nodes connected</div>';
return;
}

const html = nodes.map(node => `
<div class="node-item fade-in">
<div class="item-header">
<span class="item-title">🖥️ ${node.nodeId}</span>
<span class="status-badge status-${node.status}">${node.status}</span>
</div>
<div class="info-grid">
<div class="info-item">
<span class="info-label">IP Address:</span>
<span class="info-value">${node.ip}</span>
</div>
<div class="info-item">
<span class="info-label">TURN Port:</span>
<span class="info-value">${node.ports.turn}</span>
</div>
<div class="info-item">
<span class="info-label">TLS Port:</span>
<span class="info-value">${node.ports.tls}</span>
</div>
<div class="info-item">
<span class="info-label">Agent Port:</span>
<span class="info-value">${node.ports.agent}</span>
</div>
<div class="info-item">
<span class="info-label">Capabilities:</span>
<span class="info-value">${node.capabilities.join(', ')}</span>
</div>
<div class="info-item">
<span class="info-label">Connected:</span>
<span class="info-value">${this.formatDate(node.connectedAt)}</span>
</div>
<div class="info-item">
<span class="info-label">Last Heartbeat:</span>
<span class="info-value">${this.formatDate(node.lastHeartbeat)} (${this.getTimeAgo(node.lastHeartbeat)})</span>
</div>
</div>
</div>
`).join('');

container.innerHTML = html;
}

updateServicesList(services) {
const container = document.getElementById('servicesList');
if (!container) return;

if (services.length === 0) {
container.innerHTML = '<div class="loading">No services registered</div>';
return;
}

const html = services.map(service => `
<div class="service-item fade-in">
<div class="item-header">
<span class="item-title">🔧 ${service.serviceId}</span>
<span class="status-badge status-${service.status}">${service.status}</span>
</div>
<div class="info-grid">
<div class="info-item">
<span class="info-label">Endpoint:</span>
<span class="info-value">${service.host}:${service.port}</span>
</div>
<div class="info-item">
<span class="info-label">Capabilities:</span>
<span class="info-value">${service.metadata.capabilities.join(', ')}</span>
</div>
<div class="info-item">
<span class="info-label">Version:</span>
<span class="info-value">${service.metadata.version}</span>
</div>
<div class="info-item">
<span class="info-label">Agent Version:</span>
<span class="info-value">${service.metadata.agentVersion}</span>
</div>
<div class="info-item">
<span class="info-label">Last Heartbeat:</span>
<span class="info-value">${this.formatDate(service.metadata.lastHeartbeat)} (${this.getTimeAgo(service.metadata.lastHeartbeat)})</span>
</div>
</div>
</div>
`).join('');

container.innerHTML = html;
}

formatDate(dateString) {
return new Date(dateString).toLocaleString();
}

getTimeAgo(dateString) {
const now = new Date();
const past = new Date(dateString);
const diffMs = now - past;
const diffSec = Math.floor(diffMs / 1000);

if (diffSec < 60) return `${diffSec}s ago`;
const diffMin = Math.floor(diffSec / 60);
if (diffMin < 60) return `${diffMin}m ago`;
const diffHour = Math.floor(diffMin / 60);
return `${diffHour}h ago`;
}

updateLastRefresh() {
const element = document.getElementById('lastRefresh');
if (element) {
element.textContent = new Date().toLocaleTimeString();
}
}

startAutoRefresh() {
this.stopAutoRefresh();
this.intervalId = setInterval(() => this.loadData(), this.refreshInterval);
console.log('🔄 Auto-refresh enabled');
}

stopAutoRefresh() {
if (this.intervalId) {
clearInterval(this.intervalId);
this.intervalId = null;
console.log('⏸️ Auto-refresh disabled');
}
}
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
window.dashboard = new CoturnDashboard();
});
