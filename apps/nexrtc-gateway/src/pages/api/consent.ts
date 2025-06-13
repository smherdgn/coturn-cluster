import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, ACCESS_TOKEN_NAME } from '@/lib/authUtils';
import { logEvent } from '@/lib/logEvent';
import { createHash } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { cameraAccess, microphoneAccess, dataProcessing, medicalDataTransfer } = req.body ?? {};
  const token = req.cookies[ACCESS_TOKEN_NAME] || '';
  const user = token ? verifyToken(token) : null;
  const hashedUserId = user ? createHash('sha256').update(user.userId).digest('hex') : 'anonymous';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  logEvent('consent-recorded', { user: hashedUserId, ip, cameraAccess, microphoneAccess, dataProcessing, medicalDataTransfer });

  return res.status(200).json({ success: true });
}
