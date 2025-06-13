// ==========================================
import crypto from 'crypto';
import { logger } from '../../shared/utils/logger.js';

// COTURN/TURN server configuration
const TURN_CONFIG = {
  // Default STUN servers (public Google STUN servers)
  stunServers: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302'
  ],
  
  // TURN server configuration (update with your COTURN server details)
  turnServer: {
    urls: process.env.TURN_SERVER_URL || 'turn:your-turn-server.com:3478',
    secret: process.env.TURN_SECRET || 'your-turn-secret-key',
    ttl: 86400 // 24 hours in seconds
  }
} as const;

export function generateICEServers(): RTCIceServer[] {
  try {
    const iceServers: RTCIceServer[] = [];
    
    // Add STUN servers
    TURN_CONFIG.stunServers.forEach(url => {
      iceServers.push({ urls: url });
    });
    
    // Add TURN server with credentials if configured
    if (process.env.TURN_SERVER_URL && process.env.TURN_SECRET) {
      const turnCredentials = generateTURNCredentials('webrtc-user');
      
      iceServers.push({
        urls: TURN_CONFIG.turnServer.urls,
        username: turnCredentials.username,
        credential: turnCredentials.credential,
        credentialType: 'password'
      });
      
      // Add TURN server with TCP if available
      const turnTcpUrl = TURN_CONFIG.turnServer.urls.replace('turn:', 'turn:').concat('?transport=tcp');
      iceServers.push({
        urls: turnTcpUrl,
        username: turnCredentials.username,
        credential: turnCredentials.credential,
        credentialType: 'password'
      });
    }
    
    logger.debug('Generated ICE servers', { 
      serverCount: iceServers.length,
      hasSTUN: iceServers.some(s => s.urls.toString().startsWith('stun:')),
      hasTURN: iceServers.some(s => s.urls.toString().startsWith('turn:'))
    });
    
    return iceServers;
  } catch (error) {
    logger.error('Failed to generate ICE servers', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return fallback STUN servers
    return TURN_CONFIG.stunServers.map(url => ({ urls: url }));
  }
}

export function generateTURNCredentials(userId: string): {username: string, credential: string} {
  try {
    const timestamp = Math.floor(Date.now() / 1000) + TURN_CONFIG.turnServer.ttl;
    const username = `${timestamp}:${userId}`;
    
    // Generate HMAC-SHA1 credential using the shared secret
    const credential = crypto
      .createHmac('sha1', TURN_CONFIG.turnServer.secret)
      .update(username)
      .digest('base64');
    
    logger.debug('Generated TURN credentials', { 
      username,
      userId,
      expiresAt: new Date(timestamp * 1000).toISOString()
    });
    
    return { username, credential };
  } catch (error) {
    logger.error('Failed to generate TURN credentials', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return fallback credentials
    return { 
      username: `${Date.now()}:${userId}`, 
      credential: 'fallback-credential' 
    };
  }
}

export function validateTURNCredentials(username: string, credential: string): boolean {
  try {
    const [timestampStr, userId] = username.split(':');
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if credentials are expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (timestamp < currentTimestamp) {
      logger.warn('TURN credentials expired', { username, timestamp, currentTimestamp });
      return false;
    }
    
    // Verify credential
    const expectedCredential = crypto
      .createHmac('sha1', TURN_CONFIG.turnServer.secret)
      .update(username)
      .digest('base64');
    
    const isValid = credential === expectedCredential;
    
    if (!isValid) {
      logger.warn('Invalid TURN credentials', { username });
    }
    
    return isValid;
  } catch (error) {
    logger.error('Failed to validate TURN credentials', {
      username,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export function getTURNServerConfig() {
  return {
    url: TURN_CONFIG.turnServer.urls,
    hasSecret: Boolean(TURN_CONFIG.turnServer.secret),
    ttl: TURN_CONFIG.turnServer.ttl,
    stunServers: TURN_CONFIG.stunServers
  };
}

// Utility function to test TURN server connectivity
export async function testTURNServerConnectivity(): Promise<boolean> {
  try {
    // This is a basic test - in a real implementation, you might want to
    // use a more sophisticated connectivity test
    const iceServers = generateICEServers();
    const hasTURNServer = iceServers.some(server => 
      server.urls.toString().startsWith('turn:')
    );
    
    logger.info('TURN server connectivity test', { 
      hasTURNServer,
      totalServers: iceServers.length 
    });
    
    return hasTURNServer;
  } catch (error) {
    logger.error('TURN server connectivity test failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}
