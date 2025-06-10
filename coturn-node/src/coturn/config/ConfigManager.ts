import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface CoturnConfig {
  listeningPort: number;
  tlsListeningPort: number;
  realm: string;
  authSecret: string;
  logFile: string;
  verbose: boolean;
  fingerprint: boolean;
  noLoopbackPeers: boolean;
  noMulticastPeers: boolean;
}

export class CoturnConfigManager {
  private configPath: string;
  private config: CoturnConfig;
  private baseDir: string;

  constructor(configPath?: string) {
    // Use absolute path from project root
    const projectRoot = process.cwd();
    this.baseDir = process.env.COTURN_CONFIG_DIR || join(projectRoot, 'coturn-config');
    this.configPath = configPath || join(this.baseDir, 'turnserver.conf');
    
    console.log(`📁 ConfigManager using config dir: ${this.baseDir}`);
    this.config = this.getDefaultConfig();
    this.ensureDirectoryExists();
    this.loadConfig();
  }

  private ensureDirectoryExists(): void {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
      console.log(`📁 Created config directory: ${this.baseDir}`);
    }
  }

  private getDefaultConfig(): CoturnConfig {
    return {
      listeningPort: parseInt(process.env.COTURN_PORT || '3478'),
      tlsListeningPort: parseInt(process.env.COTURN_TLS_PORT || '5349'),
      realm: process.env.COTURN_REALM || 'turn.example.com',
      authSecret: process.env.COTURN_SECRET || 'turn-secret-key',
      logFile: join(this.baseDir, 'turnserver.log'),
      verbose: process.env.NODE_ENV === 'development',
      fingerprint: true,
      noLoopbackPeers: true,
      noMulticastPeers: true
    };
  }

  async updateConfig(newConfig: Partial<CoturnConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig };
      await this.saveConfig();
      console.log('⚙️ Config updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update config:', error);
      return false;
    }
  }

  private loadConfig(): void {
    try {
      if (!existsSync(this.configPath)) {
        console.log(`📄 Creating default config: ${this.configPath}`);
        this.saveConfig();
        return;
      }

      console.log(`📋 Config loaded from: ${this.configPath}`);
    } catch (error) {
      console.error('❌ Failed to load config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const configContent = this.generateConfigFile();
      writeFileSync(this.configPath, configContent);
      console.log(`💾 Config saved to: ${this.configPath}`);
    } catch (error) {
      console.error('❌ Failed to save config:', error);
      throw error;
    }
  }

  private generateConfigFile(): string {
    return `# Coturn TURN Server Configuration
# Generated automatically - DO NOT EDIT MANUALLY

listening-port=${this.config.listeningPort}
tls-listening-port=${this.config.tlsListeningPort}
realm=${this.config.realm}
use-auth-secret
static-auth-secret=${this.config.authSecret}

userdb=${join(this.baseDir, 'users.txt')}

${this.config.verbose ? 'verbose' : '# verbose disabled'}
${this.config.fingerprint ? 'fingerprint' : '# fingerprint disabled'}
${this.config.noLoopbackPeers ? 'no-loopback-peers' : '# loopback-peers allowed'}
${this.config.noMulticastPeers ? 'no-multicast-peers' : '# multicast-peers allowed'}

log-file=${this.config.logFile}
pidfile=${join(this.baseDir, 'turnserver.pid')}

# TLS certificates (optional)
# cert=${join(this.baseDir, 'cert.pem')}
# pkey=${join(this.baseDir, 'privkey.pem')}

cli-ip=127.0.0.1
cli-port=5766
cli-password=coturn-cli-password

# Denied peer IP ranges
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.0.0.0-192.0.0.255
denied-peer-ip=192.168.0.0-192.168.255.255
`;
  }

  getConfig(): CoturnConfig {
    return { ...this.config };
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
