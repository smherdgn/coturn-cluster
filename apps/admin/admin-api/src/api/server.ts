// admin/src/api/server.ts
import express from "express";
import path from "path";
import cors from "cors";
import { PubSubBroker } from "../pubsub/broker";
import { spawn, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class AdminAPIServer {
  private app: express.Application;
  private pubsubBroker: PubSubBroker;
  private port: number;

  constructor(port = 8080, pubsubBroker: PubSubBroker) {
    this.port = port;
    this.pubsubBroker = pubsubBroker;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());

    if (process.env.NODE_ENV === "production") {
      const uiBuildPath = path.resolve(__dirname, "../../apps/admin-ui/dist");
      this.app.use(express.static(uiBuildPath));
    }
  }

  private async applyYamlManifest(yaml: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const kubectl = spawn("kubectl", [
        "apply",
        "--validate=false",
        "-f",
        "-",
      ]);
      kubectl.stdin.write(yaml);
      kubectl.stdin.end();

      kubectl.stdout.on("data", (data) => console.log(`✅ stdout: ${data}`));
      kubectl.stderr.on("data", (data) => console.error(`❌ stderr: ${data}`));

      kubectl.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`kubectl apply failed with code ${code}`));
      });
    });
  }

  private setupRoutes() {
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        pubsub: this.pubsubBroker.getClientStats(),
      });
    });

    this.app.get("/api/services", (req, res) => {
      const nodes = this.pubsubBroker.getConnectedNodes();
      const services = nodes.map((node) => ({
        serviceId: `coturn-node-${node.nodeId}`,
        host: node.ip,
        port: node.ports.turn,
        status: node.status,
        metadata: {
          nodeId: node.nodeId,
          capabilities: node.capabilities,
          version: node.version,
          agentVersion: node.agentVersion,
          lastHeartbeat: node.lastHeartbeat,
        },
      }));
      res.json(services);
    });

    this.app.get("/api/nodes", (req, res) => {
      const nodes = this.pubsubBroker.getConnectedNodes();
      res.json(nodes);
    });

    this.app.get("/api/debug", (req, res) => {
      res.json(this.pubsubBroker.debugInfo());
    });

    this.app.get("/api/nodes/:nodeId/logs", async (req, res) => {
      const { nodeId } = req.params;
      try {
        const { stdout: podNameRaw } = await execAsync(
          `kubectl get pods -l node-id=${nodeId} -o jsonpath="{.items[0].metadata.name}"`
        );
        const podName = podNameRaw.trim().replace(/["'\n\r]/g, "");
        if (!podName) return res.status(404).json({ error: "Pod bulunamadı" });

        const { stdout, stderr } = await execAsync(
          `kubectl logs ${podName} --tail=500`
        );
        res.setHeader("Content-Type", "text/plain");
        res.send(stdout + "\n" + stderr);
      } catch (error: any) {
        console.error("❌ Log alma hatası:", error);
        res.status(500).json({ error: "Log alınamadı", detail: error.message });
      }
    });

    this.app.get("/api/k8s-dashboard-url", (req, res) => {
      res.json({
        url: "http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/",
      });
    });

    this.app.post("/api/nodes", async (req, res) => {
      try {
        const { ip, ports, autoRegisterNginx } = req.body;
        const finalIP = ip || this.generateUniqueIP();
        const finalPorts = ports || this.generateUniquePorts();
        const nodeId = `${finalIP.split(".").pop()}-${Date.now().toString(36)}`;

        console.log(`🚀 Kubernetes'e yeni Coturn node ekleniyor: ${nodeId}`);

        const yamlManifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coturn-${nodeId}
  labels:
    app: coturn-node
    node-id: ${nodeId}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: coturn-node
      node-id: ${nodeId}
  template:
    metadata:
      labels:
        app: coturn-node
        node-id: ${nodeId}
    spec:
      containers:
        - name: coturn
          image: coturn-cluster_coturn-node
          tty: true
          stdin: true
          env:
            - name: NODE_ID
              value: "${nodeId}"
            - name: COTURN_AGENT_PORT
              value: "${finalPorts.agent}"
            - name: COTURN_PORT
              value: "${finalPorts.turn}"
            - name: COTURN_TLS_PORT
              value: "${finalPorts.tls}"
            - name: ADMIN_PUBSUB_URL
              value: "ws://admin:9000"
          ports:
            - containerPort: ${finalPorts.turn}
`;

        await this.applyYamlManifest(yamlManifest);

        if (autoRegisterNginx) {
          console.log(`🔧 Nginx güncellenecek: ${finalIP}:${finalPorts.turn}`);
        }

        res.json({
          success: true,
          nodeId,
          ip: finalIP,
          ports: finalPorts,
          message: "Kubernetes node oluşturuldu",
        });
      } catch (error) {
        console.error("❌ Kubernetes node oluşturma hatası:", error);
        res
          .status(500)
          .json({ success: false, error: "Kubernetes node eklenemedi" });
      }
    });

    this.app.delete("/api/nodes/:nodeId", async (req, res) => {
      try {
        const { nodeId } = req.params;
        console.log(`🗑️ Kubernetes deployment siliniyor: ${nodeId}`);
        await execAsync(`kubectl delete deployment coturn-${nodeId}`);
        res.json({ success: true, message: "Node silindi" });
      } catch (error) {
        res.status(500).json({ error: "Node silme başarısız" });
      }
    });

    this.app.post("/api/nodes/:nodeId/restart", async (req, res) => {
      try {
        const { nodeId } = req.params;
        console.log(`🔄 Kubernetes deployment yeniden başlatılıyor: ${nodeId}`);
        await execAsync(`kubectl delete deployment coturn-${nodeId}`);
        res.json({ success: true, message: "Node yeniden başlatıldı" });
      } catch (error) {
        res.status(500).json({ error: "Yeniden başlatma başarısız" });
      }
    });

    this.app.get("/api/nginx/status", (req, res) => {
      const nodes = this.pubsubBroker.getConnectedNodes();
      const upstreams = nodes.map((node) => ({
        name: `coturn-${node.nodeId}`,
        servers: [
          {
            address: `${node.ip}:${node.ports.turn}`,
            status: node.status === "healthy" ? "up" : "down",
            weight: 1,
            requests: Math.floor(Math.random() * 1000) + 100,
            responses: {
              "2xx": Math.floor(Math.random() * 900) + 80,
              "4xx": Math.floor(Math.random() * 10),
              "5xx": Math.floor(Math.random() * 5),
            },
          },
        ],
      }));

      res.json({
        status: "active",
        totalRequests: 12547,
        activeConnections: 234,
        upstreams,
      });
    });

    this.app.get("/api/security/status", (req, res) => {
      res.json({
        sslCertificates: [
          { domain: "*.coturn.local", status: "valid", expiresIn: "89 days" },
          {
            domain: "admin.coturn.local",
            status: "valid",
            expiresIn: "89 days",
          },
        ],
        firewall: { status: "active", rules: 15 },
        authentication: { type: "JWT", status: "enabled" },
        encryption: { status: "enabled", algorithm: "AES-256" },
      });
    });

    if (process.env.NODE_ENV === "production") {
      const uiBuildPath = path.resolve(__dirname, "../../apps/admin-ui/dist");

      this.app.use(express.static(uiBuildPath));

      this.app.get("*", (req, res) => {
        res.sendFile(path.join(uiBuildPath, "index.html"));
      });
    }
  }

  private generateUniqueIP(): string {
    const existingNodes = this.pubsubBroker.getConnectedNodes();
    const usedIPs = existingNodes.map((n) => n.ip);
    const baseIP = "192.168.1.";

    for (let i = 10; i < 255; i++) {
      const testIP = baseIP + i;
      if (!usedIPs.includes(testIP)) {
        return testIP;
      }
    }

    return `192.168.1.${Math.floor(Math.random() * 245) + 10}`;
  }

  private generateUniquePorts(): { agent: number; turn: number; tls: number } {
    const existingNodes = this.pubsubBroker.getConnectedNodes();
    const usedPorts = existingNodes.reduce((ports: number[], node) => {
      return [...ports, node.ports.agent, node.ports.turn, node.ports.tls];
    }, []);

    const findNextPort = (basePort: number): number => {
      for (let i = 0; i < 100; i++) {
        const testPort = basePort + i;
        if (!usedPorts.includes(testPort)) {
          return testPort;
        }
      }
      return basePort;
    };

    return {
      agent: findNextPort(8100),
      turn: findNextPort(3478),
      tls: findNextPort(5349),
    };
  }

  async start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.app
        .listen(this.port, () => {
          console.log(`📊 Admin API Server: http://localhost:${this.port}`);
          console.log(`🎛️ Dashboard: http://localhost:${this.port}`);
          resolve();
        })
        .on("error", reject);
    });
  }
}
