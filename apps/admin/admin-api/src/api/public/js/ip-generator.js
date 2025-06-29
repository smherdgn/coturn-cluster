// Enhanced IP and Port Generation
class IPPortGenerator {
constructor() {
this.usedIPs = new Set();
this.usedPorts = new Set();
this.loadExistingData();
}

async loadExistingData() {
try {
const nodes = await fetch('/api/nodes').then(r => r.json());
nodes.forEach(node => {
this.usedIPs.add(node.ip);
this.usedPorts.add(node.ports.agent);
this.usedPorts.add(node.ports.turn);
this.usedPorts.add(node.ports.tls);
});
} catch (error) {
console.log('No existing nodes found');
}
}

generateNextIP() {
const baseIP = '192.168.1.';

// Try sequential IPs first
for (let i = 10; i < 255; i++) {
const testIP = baseIP + i;
if (!this.usedIPs.has(testIP)) {
this.usedIPs.add(testIP);
return testIP;
}
}

// Fallback to random
const randomSuffix = Math.floor(Math.random() * 245) + 10;
const fallbackIP = baseIP + randomSuffix;
this.usedIPs.add(fallbackIP);
return fallbackIP;
}

generateNextPorts() {
const findNextPort = (basePort) => {
for (let i = 0; i < 100; i++) {
const testPort = basePort + i;
if (!this.usedPorts.has(testPort)) {
this.usedPorts.add(testPort);
return testPort;
}
}
return basePort;
};

return {
agent: findNextPort(8100),
turn: findNextPort(3478),
tls: findNextPort(5349)
};
}
}

window.ipPortGenerator = new IPPortGenerator();
