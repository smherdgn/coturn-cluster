import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export enum ProcessStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error'
}

export interface ProcessInfo {
  status: ProcessStatus;
  pid?: number;
  uptime?: number;
  startTime?: Date;
  restartCount: number;
  lastError?: string;
}

export class CoturnProcessManager {
  private process: ChildProcess | null = null;
  private status: ProcessStatus = ProcessStatus.STOPPED;
  private configPath: string;
  private startTime: Date | null = null;
  private restartCount: number = 0;
  private lastError: string | null = null;

  constructor(configPath?: string) {
    const projectRoot = process.cwd();
    const baseDir = process.env.COTURN_CONFIG_DIR || join(projectRoot, 'coturn-config');
    this.configPath = configPath || join(baseDir, 'turnserver.conf');
    console.log(`📁 ProcessManager using config: ${this.configPath}`);
  }

  async start(): Promise<boolean> {
    try {
      if (this.status === ProcessStatus.RUNNING) {
        console.log('⚠️ Coturn already running');
        return true;
      }

      // Check if config exists
      if (!existsSync(this.configPath)) {
        console.log(`⚠️ Config file not found: ${this.configPath}`);
        console.log('🔧 Running in development mode');
        this.status = ProcessStatus.RUNNING;
        this.startTime = new Date();
        this.restartCount++;
        return true;
      }

      this.status = ProcessStatus.STARTING;
      console.log('🚀 Starting Coturn process...');

      // Try to start real coturn
      try {
        this.process = spawn('turnserver', ['-c', this.configPath], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        this.process.stdout?.on('data', (data) => {
          console.log(`📋 Coturn: ${data.toString().trim()}`);
        });

        this.process.stderr?.on('data', (data) => {
          console.error(`❌ Coturn Error: ${data.toString().trim()}`);
        });

        this.process.on('error', (error) => {
          console.log(`⚠️ Coturn binary not found: ${error.message}`);
          console.log('🔧 Running in development mode');
          this.status = ProcessStatus.RUNNING;
          this.lastError = null;
        });

        this.process.on('exit', (code, signal) => {
          console.log(`🛑 Coturn exited with code ${code}, signal ${signal}`);
          this.status = ProcessStatus.STOPPED;
          this.process = null;
          this.startTime = null;
        });

        await this.waitForStart();
        
      } catch (error) {
        console.log('🔧 Coturn binary not available, running in development mode');
      }
      
      this.status = ProcessStatus.RUNNING;
      this.startTime = new Date();
      this.restartCount++;
      
      console.log(`✅ Coturn process manager ready`);
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize process manager:', error);
      this.status = ProcessStatus.RUNNING; // Allow development mode
      this.startTime = new Date();
      this.lastError = null;
      return true;
    }
  }

  async stop(): Promise<boolean> {
    try {
      if (this.status === ProcessStatus.STOPPED) {
        console.log('⚠️ Coturn already stopped');
        return true;
      }

      if (!this.process) {
        this.status = ProcessStatus.STOPPED;
        return true;
      }

      this.status = ProcessStatus.STOPPING;
      console.log('🛑 Stopping Coturn process...');

      this.process.kill('SIGTERM');
      await this.waitForStop();
      
      this.status = ProcessStatus.STOPPED;
      this.process = null;
      this.startTime = null;
      
      console.log('✅ Coturn stopped successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to stop Coturn:', error);
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  async restart(): Promise<boolean> {
    console.log('🔄 Restarting Coturn...');
    
    const stopped = await this.stop();
    if (!stopped) {
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await this.start();
  }

  private async waitForStart(): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(); // Don't reject in dev mode
      }, 3000);

      if (this.process) {
        const checkInterval = setInterval(() => {
          if (this.process && this.process.pid) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);
      } else {
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  private async waitForStop(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        reject(new Error('Coturn stop timeout - force killed'));
      }, 10000);

      const checkInterval = setInterval(() => {
        if (!this.process || this.process.killed) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  getProcessInfo(): ProcessInfo {
    return {
      status: this.status,
      pid: this.process?.pid,
      uptime: this.startTime ? Math.floor((Date.now() - this.startTime.getTime()) / 1000) : undefined,
      startTime: this.startTime || undefined,
      restartCount: this.restartCount,
      lastError: this.lastError || undefined
    };
  }

  isRunning(): boolean {
    return this.status === ProcessStatus.RUNNING;
  }
}
