// Dynamic configuration based on current location
const config = {
  apiUrl: window.location.origin + '/api',
  wsUrl: `ws://${window.location.hostname}:${window.location.port}`,
  dashboardUrl: window.location.origin
};

// Export for use in other files
window.appConfig = config;

// Function to get dynamic config
async function getConfig() {
  try {
    const response = await fetch('/api/websocket-info');
    const result = await response.json();
    
    if (result.success) {
      window.COTURN_CONFIG = result.data;
    }
  } catch (error) {
    console.warn('Using fallback config:', error);
  }
  
  return window.COTURN_CONFIG;
}
