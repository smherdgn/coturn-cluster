 
import { getConfigValue, setConfigValue } from '@/lib/config';
import { JWT_SECRET } from '@/lib/authUtils';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
    if (!key) {
      return res.status(400).json({ message: 'Missing key parameter' });
    }
    const value = await getConfigValue(key);
    if (value === null) {
      return res.status(404).json({ message: 'Config not found' });
    }
    return res.status(200).json({ value });
  } else if (req.method === 'POST') {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as User & { iat: number; exp: number };
      const adminEmail = (await getConfigValue('admin_email')) || '';
      if (decoded.email !== adminEmail) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const { key, value } = req.body as { key: string; value: string };
      if (!key || typeof value !== 'string') {
        return res.status(400).json({ message: 'Invalid body' });
      }
      await setConfigValue(key, value);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
  return res.status(405).json({ message: 'Method Not Allowed' });
 }
