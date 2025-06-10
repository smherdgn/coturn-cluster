import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CoturnStats {
  connections: {
    active: number;
    total: number;
    byProtocol: {
      udp: number;
      tcp: number;
      tls: number;
    };
  };
  bandwidth: {
    inbound: number;
    outbound: number;
    total: number;
  };
  sessions: {
    active: number;
    peak: number;
    total: number;
    avgDuration: number;
  };
  allocations: {
    current: number;
    total: number;
    failed: number;
  };
  errors: {
    authFailures: number;
    timeouts: number;
    networkErrors: number;
  };
}

export class CoturnStatsManager {
  private cliPort: number;
  private cliPassword: string;

  constructor(cliPort: number = 5766, cliPassword: string = 'coturn-cli-password') {
    this.cliPort = cliPort;
    this.cliPassword = cliPassword;
  }

  async getStats(): Promise<CoturnStats> {
    try {
      const realStats = await this.getRealCoturnStats();
      return realStats;
    } catch (error) {
      console.log('📊 Using mock stats (Coturn CLI not available)');
      return this.getMockStats();
    }
  }

  private async getRealCoturnStats(): Promise<CoturnStats> {
    try {
      const command = `echo "info" | nc 127.0.0.1 ${this.cliPort}`;
      const { stdout } = await execAsync(command);
      
      return this.parseCoturnOutput(stdout);
    } catch (error) {
      throw new Error(`Failed to connect to Coturn CLI: ${error}`);
    }
  }

  private parseCoturnOutput(output: string): CoturnStats {
    const lines = output.split('\n');
    const stats: CoturnStats = {
      connections: { active: 0, total: 0, byProtocol: { udp: 0, tcp: 0, tls: 0 } },
      bandwidth: { inbound: 0, outbound: 0, total: 0 },
      sessions: { active: 0, peak: 0, total: 0, avgDuration: 0 },
      allocations: { current: 0, total: 0, failed: 0 },
      errors: { authFailures: 0, timeouts: 0, networkErrors: 0 }
    };

    for (const line of lines) {
      if (line.includes('Total sessions:')) {
        stats.sessions.total = this.extractNumber(line);
      } else if (line.includes('Active sessions:')) {
        stats.sessions.active = this.extractNumber(line);
      } else if (line.includes('Total allocations:')) {
        stats.allocations.total = this.extractNumber(line);
      } else if (line.includes('Current allocations:')) {
        stats.allocations.current = this.extractNumber(line);
      }
    }

    stats.connections.active = stats.sessions.active;
    stats.connections.total = stats.sessions.total || stats.sessions.active;
    stats.bandwidth.total = stats.bandwidth.inbound + stats.bandwidth.outbound;

    return stats;
  }

  private extractNumber(line: string): number {
    const match = line.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  private getMockStats(): CoturnStats {
    return {
      connections: {
        active: Math.floor(Math.random() * 100),
        total: Math.floor(Math.random() * 1000),
        byProtocol: {
          udp: Math.floor(Math.random() * 50),
          tcp: Math.floor(Math.random() * 30),
          tls: Math.floor(Math.random() * 20)
        }
      },
      bandwidth: {
        inbound: Math.floor(Math.random() * 1000000),
        outbound: Math.floor(Math.random() * 1500000),
        total: Math.floor(Math.random() * 2500000)
      },
      sessions: {
        active: Math.floor(Math.random() * 50),
        peak: Math.floor(Math.random() * 100),
        total: Math.floor(Math.random() * 200),
        avgDuration: Math.floor(Math.random() * 3600)
      },
      allocations: {
        current: Math.floor(Math.random() * 25),
        total: Math.floor(Math.random() * 500),
        failed: Math.floor(Math.random() * 10)
      },
      errors: {
        authFailures: Math.floor(Math.random() * 10),
        timeouts: Math.floor(Math.random() * 5),
        networkErrors: Math.floor(Math.random() * 3)
      }
    };
  }
}
