export type Status =
  | "healthy"
  | "up"
  | "active"
  | "valid"
  | "enabled"
  | "unhealthy"
  | "down"
  | "error"
  | "unknown"
  | string;

export interface NavItem {
  name: string;
  path: string;
  icon: string;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface Node {
  nodeId: string;
  ip: string;
  ports: { turn: number; tls: number; agent: number };
  status: Status;
}

export interface Service {
  serviceId: string;
  host: string;
  port: number;
  status: Status;
  metadata: {
    nodeId: string;
    version?: string;
    lastHeartbeat?: string;
  };
}

export interface User {
  id: string | number;
  username: string;
  realm: string;
  createdAt?: string;
}

export interface DebugInfo {
  totalNodes: number;
  totalClients: number;
  nodeStatuses: { nodeId: string; status: Status }[];
}

export interface NginxServer {
  address: string;
  status: Status;
  weight: number;
  requests: number;
  responses: { "2xx": number; "4xx": number; "5xx": number };
}

export interface NginxUpstream {
  name: string;
  servers: NginxServer[];
}

export interface NginxStatus {
  status: Status;
  totalRequests: number;
  activeConnections: number;
  upstreams: NginxUpstream[];
}

export interface SecurityStatus {
  sslCertificates: { domain: string; expiresIn: string; status: Status }[];
  firewall: { status: Status; rules: number };
  authentication: { type: string; status: Status };
  encryption: { algorithm: string; status: Status };
}
