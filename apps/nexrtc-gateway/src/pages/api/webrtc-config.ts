import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
 
   return res.status(200).json({
     iceServers: [
      {
        urls: ['turns:secure.example.com:5349'],
        username: 'user',
        credential: 'secret',
       },
 
 
  const turnUrls = (process.env.TURN_URLS || 'turns:secure.example.com:5349')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  const turnUsername = process.env.TURN_USERNAME || 'user';
  const turnCredential = process.env.TURN_CREDENTIAL || 'secret';

  return res.status(200).json({
    iceServers: [
      {
        urls: turnUrls,
        username: turnUsername,
        credential: turnCredential,
       },
     ],
    iceTransportPolicy: 'relay',
  });
}
