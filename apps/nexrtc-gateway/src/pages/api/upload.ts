import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { verifyToken, ACCESS_TOKEN_NAME } from '@/lib/authUtils';
import { logEvent } from '@/lib/logEvent';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const token = req.cookies[ACCESS_TOKEN_NAME] || '';
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const form = formidable({ multiples: false });
 
   form.parse(req, async (err: any, _fields: any, files: any) => {
     if (err) {
      return res.status(400).json({ message: 'Invalid form data' });
    }
    const file = (files as any).file as any;
 
    if (!file) {
      return res.status(400).json({ message: 'No file' });
    }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.mimetype || '')) {
      return res.status(400).json({ message: 'Invalid file type' });
    }
 
     const uploadDir = path.join(process.cwd(), 'uploads');
 
     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = Date.now() + '_' + file.originalFilename;
    const dest = path.join(uploadDir, filename);
    await fs.promises.rename(file.filepath, dest);
    const url = `/uploads/${filename}`;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logEvent('file-upload', { userId: user.userId, filename, ip });

    res.status(200).json({ url });
  });
}
