import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, ACCESS_TOKEN_NAME } from '@/lib/authUtils';
import { getAllSessions } from '@/lib/sessionManager';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.cookies[ACCESS_TOKEN_NAME] || '';
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const sessions = getAllSessions();
  return res.status(200).json(sessions);
}
