#!/usr/bin/env tsx
/**
 * Environment Manager - Distributes .env to all subprojects
 * Usage: tsx scripts/sync-env.ts
 */

import fs from 'fs';
import path from 'path';

interface EnvSyncResult {
  project: string;
  success: boolean;
  error?: string;
}

interface EnvSummary {
  totalVars: number;
  criticalVars: Record<string, string | undefined>;
  syncResults: EnvSyncResult[];
}

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');

const SUBPROJECTS = ['admin', 'coturn-node', 'shared'] as const;

const CRITICAL_VARS = [
  'POSTGRES_PASSWORD',
  'POSTGRES_HOST', 
  'POSTGRES_USER',
  'ADMIN_API_PORT',
  'ADMIN_PUBSUB_PORT',
  'COTURN_AGENT_PORT',
  'NODE_ENV'
] as const;

/**
 * Parse .env file and clean export keywords
 */
function parseEnvFile(envPath: string): string {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    let cleanLine = line.trim();
    
    // Skip comments and empty lines - preserve them
    if (cleanLine.startsWith('#') || cleanLine === '') {
      cleanedLines.push(line);
      continue;
    }

    // Remove 'export ' prefix if exists
    if (cleanLine.startsWith('export ')) {
      cleanLine = cleanLine.replace(/^export\s+/, '');
    }

    cleanedLines.push(cleanLine);
  }

  return cleanedLines.join('\n');
}

/**
 * Extract environment variables from content
 */
function extractEnvVars(content: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      envVars[key] = value;
    }
  }

  return envVars;
}

/**
 * Create/update .env file in subproject
 */
function syncEnvToProject(projectName: string, envContent: string): EnvSyncResult {
  const projectPath = path.join(ROOT_DIR, projectName);
  const projectEnvPath = path.join(projectPath, '.env');

  if (!fs.existsSync(projectPath)) {
    return {
      project: projectName,
      success: false,
      error: `Project directory not found: ${projectName}`
    };
  }

  try {
    fs.writeFileSync(projectEnvPath, envContent);
    return { project: projectName, success: true };
  } catch (error) {
    return {
      project: projectName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Main sync function
 */
function syncEnvironments(): EnvSummary {
  console.log('🔄 Starting environment sync...\n');

  try {
    // Parse and clean main .env file
    const cleanEnvContent = parseEnvFile(ENV_FILE);
    const envVars = extractEnvVars(cleanEnvContent);
    
    // Add header comment
    const header = `# ======================================== 
# AUTO-SYNCED FROM ROOT .env
# Generated: ${new Date().toISOString()}
# DO NOT EDIT - Changes will be overwritten
# ========================================\n\n`;
    
    const finalContent = header + cleanEnvContent;

    // Sync to all subprojects
    const syncResults: EnvSyncResult[] = [];
    for (const project of SUBPROJECTS) {
      const result = syncEnvToProject(project, finalContent);
      syncResults.push(result);
      
      if (result.success) {
        console.log(`✅ Synced .env to ${project}`);
      } else {
        console.log(`❌ Failed to sync .env to ${project}: ${result.error}`);
      }
    }

    // Extract critical variables
    const criticalVars: Record<string, string | undefined> = {};
    for (const varName of CRITICAL_VARS) {
      criticalVars[varName] = envVars[varName];
    }

    const summary: EnvSummary = {
      totalVars: Object.keys(envVars).length,
      criticalVars,
      syncResults
    };

    // Display results
    const successCount = syncResults.filter(r => r.success).length;
    console.log(`\n🎉 Environment sync completed!`);
    console.log(`✅ ${successCount}/${SUBPROJECTS.length} projects synced successfully`);

    // Show environment summary
    console.log(`\n📊 Environment Summary:`);
    console.log(`📝 ${summary.totalVars} environment variables found`);
    
    // Show critical vars
    console.log('\n🔑 Critical Variables:');
    for (const [varName, value] of Object.entries(criticalVars)) {
      if (value !== undefined) {
        // Mask sensitive values
        const displayValue = varName.includes('PASSWORD') || varName.includes('SECRET') 
          ? '*'.repeat(8) 
          : value;
        console.log(`   ${varName}=${displayValue}`);
      } else {
        console.log(`   ❌ ${varName}=NOT_SET`);
      }
    }

    return summary;

  } catch (error) {
    console.error('❌ Environment sync failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Watch mode - auto-sync on .env changes
 */
function watchMode(): void {
  console.log('👀 Watching .env file for changes...');
  
  fs.watchFile(ENV_FILE, (curr, prev) => {
    console.log('\n🔄 .env file changed, syncing...');
    syncEnvironments();
  });

  // Initial sync
  syncEnvironments();
}

/**
 * Validate environment setup
 */
function validateEnvironment(): boolean {
  console.log('🔍 Validating environment setup...\n');
  
  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ Root .env file not found!');
    return false;
  }

  const envContent = parseEnvFile(ENV_FILE);
  const envVars = extractEnvVars(envContent);
  
  let isValid = true;
  
  for (const varName of CRITICAL_VARS) {
    if (!envVars[varName]) {
      console.error(`❌ Missing critical variable: ${varName}`);
      isValid = false;
    }
  }

  if (isValid) {
    console.log('✅ Environment validation passed');
  }

  return isValid;
}

// CLI handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔧 Environment Manager

Usage:
  tsx scripts/sync-env.ts                 # Sync once
  tsx scripts/sync-env.ts --watch         # Watch mode
  tsx scripts/sync-env.ts --validate      # Validate only
  tsx scripts/sync-env.ts --help          # Show help

Options:
  -w, --watch      Watch .env file for changes
  -v, --validate   Validate environment setup only
  -h, --help       Show this help message
  `);
} else if (args.includes('--validate') || args.includes('-v')) {
  validateEnvironment();
} else if (args.includes('--watch') || args.includes('-w')) {
  watchMode();
} else {
  syncEnvironments();
}