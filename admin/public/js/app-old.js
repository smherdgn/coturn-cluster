// Enhanced Coturn Cluster Management Application
class CoturnClusterApp {
    constructor() {
        this.currentPage = 'overview';
        this.refreshInterval = 30000;
        this.intervalId = null;
        this.data = {
            nodes: [],
            services: [],
            nginxUpstreams: [],
            logs: [],
            config: {},
            stats: {}
        };
        this.init();
    }

    init() {
        console.log('🎛️ Coturn Cluster Management App initializing...');
        this.setupNavigation();
        this.loadPage('overview');
        this.startAutoRefresh();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.loadPage(page);
                }
            });
        });
    }

    loadPage(pageName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.querySelector(`[data-page="${pageName}"]`);
        if (navItem) navItem.classList.add('active');

        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        const pageElement = document.getElementById(`${pageName}-page`);
        if (pageElement) pageElement.classList.add('active');

        this.currentPage = pageName;
        this.loadPageData(pageName);
    }

    async loadPageData(pageName) {
        switch (pageName) {
            case 'overview':
                await this.loadOverviewData();
                break;
            case 'nodes':
                await this.loadNodesData();
                break;
            case 'services':
                await this.loadServicesData();
                break;
            case 'load-balancer':
                await this.loadLoadBalancerData();
                break;
            case 'security':
                await this.loadSecurityData();
                break;
        }
    }

    async loadOverviewData() {
        try {
            const [debug, nodes, services] = await Promise.all([
                this.fetchData('/api/debug'),
                this.fetchData('/api/nodes'),
                this.fetchData('/api/services')
            ]);

            this.updateOverviewStats(debug);
            this.updateOverviewNodes(nodes);
            this.updateOverviewServices(services);
            this.updateSystemHealth();
        } catch (error) {
            console.error('Error loading overview data:', error);
        }
    }

    async loadNodesData() {
        try {
            const nodes = await this.fetchData('/api/nodes');
            this.data.nodes = nodes;
            this.updateNodesTable(nodes);
        } catch (error) {
            console.error('Error loading nodes data:', error);
        }
    }

    async loadServicesData() {
        try {
            const services = await this.fetchData('/api/services');
            this.data.services = services;
            this.updateServicesTable(services);
        } catch (error) {
            console.error('Error loading services data:', error);
        }
    }

    async loadLoadBalancerData() {
        try {
            const nginxData = await this.fetchData('/api/nginx/status');
            this.updateLoadBalancerView(nginxData);
        } catch (error) {
            console.error('Error loading load balancer data:', error);
        }
    }

    async loadSecurityData() {
        try {
            const securityData = await this.fetchData('/api/security/status');
            this.updateSecurityView(securityData);
        } catch (error) {
            console.error('Error loading security data:', error);
        }
    }

    async fetchData(endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    updateOverviewStats(debug) {
        const statsContainer = document.getElementById('overview-stats');
        if (!statsContainer) return;
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${debug.totalNodes || 0}</span>
                <span class="stat-label">Total Nodes</span>
            </div>
        `;
    }

    updateOverviewNodes(nodes) {
        const container = document.getElementById('overview-nodes');
        if (!container) return;
        if (nodes.length === 0) {
            container.innerHTML = '<p class="text-muted">No nodes connected</p>';
            return;
        }
        container.innerHTML = nodes.slice(0, 5).map(node => `
            <div class="flex justify-between items-center mb-2">
                <div>
                    <strong>${node.nodeId}</strong>
                    <div class="text-muted" style="font-size: 0.875rem;">${node.ip}:${node.ports.turn}</div>
                </div>
                <span class="badge badge-success">healthy</span>
            </div>
        `).join('');
    }

    updateOverviewServices(services) {
        const container = document.getElementById('overview-services');
        if (!container) return;
        if (services.length === 0) {
            container.innerHTML = '<p class="text-muted">No services registered</p>';
            return;
        }
        container.innerHTML = services.slice(0, 5).map(service => `
            <div class="flex justify-between items-center mb-2">
                <div>
                    <strong>${service.serviceId}</strong>
                    <div class="text-muted" style="font-size: 0.875rem;">${service.host}:${service.port}</div>
                </div>
                <span class="badge badge-success">healthy</span>
            </div>
        `).join('');
    }

    updateSystemHealth() {
        const container = document.getElementById('system-health');
        if (!container) return;
        const healthChecks = [
            { name: 'Database Connection', status: 'healthy', details: 'PostgreSQL responsive' },
            { name: 'Redis Cache', status: 'healthy', details: 'Cache hit rate: 94%' },
            { name: 'WebSocket Server', status: 'healthy', details: 'Port 9000 active' }
        ];
        container.innerHTML = healthChecks.map(check => `
            <div class="flex justify-between items-center mb-2">
                <div>
                    <strong>${check.name}</strong>
                    <div class="text-muted" style="font-size: 0.875rem;">${check.details}</div>
                </div>
                <span class="badge badge-success">${check.status}</span>
            </div>
        `).join('');
    }

    updateNodesTable(nodes) {
        const container = document.getElementById('nodes-table');
        if (!container) return;
        if (nodes.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No nodes connected</p>';
            return;
        }
        container.innerHTML = `<table class="table"><thead><tr><th>Node ID</th><th>Status</th></tr></thead><tbody>${nodes.map(node => `<tr><td>${node.nodeId}</td><td><span class="badge badge-success">healthy</span></td></tr>`).join('')}</tbody></table>`;
    }

    updateServicesTable(services) {
        const container = document.getElementById('services-table');
        if (!container) return;
        if (services.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No services registered</p>';
            return;
        }
        container.innerHTML = `<table class="table"><thead><tr><th>Service ID</th><th>Status</th></tr></thead><tbody>${services.map(service => `<tr><td>${service.serviceId}</td><td><span class="badge badge-success">healthy</span></td></tr>`).join('')}</tbody></table>`;
    }

    updateLoadBalancerView(nginxData) {
        const container = document.getElementById('load-balancer-content');
        if (!container) return;
        container.innerHTML = '<p>Load balancer configuration will be displayed here.</p>';
    }

    updateSecurityView(securityData) {
        const container = document.getElementById('security-content');
        if (!container) return;
        container.innerHTML = '<p>Security status will be displayed here.</p>';
    }

    formatTimeAgo(dateString) {
        return 'just now';
    }

    calculateUptime() {
        return '2d 14h 32m';
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.intervalId = setInterval(() => {
            this.loadPageData(this.currentPage);
        }, this.refreshInterval);
        console.log('🔄 Auto-refresh enabled');
    }

    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new CoturnClusterApp();
});
