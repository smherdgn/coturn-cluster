import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface CoturnUser {
  username: string;
  password: string;
  realm: string;
  enabled: boolean;
  createdAt: Date;
}

export class CoturnUserManager {
  private usersFilePath: string;
  private users: Map<string, CoturnUser> = new Map();

  constructor(usersFilePath?: string) {
    // Use absolute path from project root
    const projectRoot = process.cwd();
    const baseDir = process.env.COTURN_CONFIG_DIR || join(projectRoot, 'coturn-config');
    this.usersFilePath = usersFilePath || join(baseDir, 'users.txt');
    
    console.log(`📁 UserManager using config dir: ${baseDir}`);
    this.ensureDirectoryExists();
    this.loadUsers();
  }

  private ensureDirectoryExists(): void {
    const dir = dirname(this.usersFilePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created config directory: ${dir}`);
    }
  }

  async addUser(username: string, password: string, realm: string): Promise<boolean> {
    try {
      const userKey = `${username}@${realm}`;
      
      const user: CoturnUser = {
        username,
        password,
        realm,
        enabled: true,
        createdAt: new Date()
      };

      this.users.set(userKey, user);
      await this.saveUsers();
      
      console.log(`✅ User added: ${userKey} -> ${this.usersFilePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to add user ${username}:`, error);
      return false;
    }
  }

  async removeUser(username: string, realm: string): Promise<boolean> {
    try {
      const userKey = `${username}@${realm}`;
      
      if (this.users.has(userKey)) {
        this.users.delete(userKey);
        await this.saveUsers();
        console.log(`🗑️ User removed: ${userKey}`);
        return true;
      }
      
      console.warn(`⚠️ User not found: ${userKey}`);
      return false;
    } catch (error) {
      console.error(`❌ Failed to remove user ${username}:`, error);
      return false;
    }
  }

  async updateUser(username: string, realm: string, newPassword?: string): Promise<boolean> {
    try {
      const userKey = `${username}@${realm}`;
      const user = this.users.get(userKey);
      
      if (!user) {
        console.warn(`⚠️ User not found for update: ${userKey}`);
        return false;
      }

      if (newPassword) {
        user.password = newPassword;
      }

      this.users.set(userKey, user);
      await this.saveUsers();
      
      console.log(`✏️ User updated: ${userKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update user ${username}:`, error);
      return false;
    }
  }

  private loadUsers(): void {
    try {
      if (!existsSync(this.usersFilePath)) {
        console.log(`📄 Creating new users file: ${this.usersFilePath}`);
        writeFileSync(this.usersFilePath, '');
        return;
      }

      const content = readFileSync(this.usersFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const [username, password, realm] = line.split(':');
        if (username && password && realm) {
          const userKey = `${username}@${realm}`;
          this.users.set(userKey, {
            username,
            password,
            realm,
            enabled: true,
            createdAt: new Date()
          });
        }
      }

      console.log(`📋 Loaded ${this.users.size} users from file`);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
    }
  }

  private async saveUsers(): Promise<void> {
    try {
      const lines: string[] = [];
      
      for (const user of this.users.values()) {
        if (user.enabled) {
          lines.push(`${user.username}:${user.password}:${user.realm}`);
        }
      }

      writeFileSync(this.usersFilePath, lines.join('\n') + '\n');
      console.log(`💾 Saved ${lines.length} users to file: ${this.usersFilePath}`);
    } catch (error) {
      console.error('❌ Failed to save users:', error);
      throw error;
    }
  }

  getUserCount(): number {
    return this.users.size;
  }

  listUsers(): CoturnUser[] {
    return Array.from(this.users.values());
  }

  getFilePath(): string {
    return this.usersFilePath;
  }
}
