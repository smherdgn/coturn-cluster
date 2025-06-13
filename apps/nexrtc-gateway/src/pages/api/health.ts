import type { NextApiRequest, NextApiResponse } from 'next';

const start = Date.now();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const uptime = Math.floor((Date.now() - start) / 1000);
  res.status(200).json({ ok: true, uptime });
}
