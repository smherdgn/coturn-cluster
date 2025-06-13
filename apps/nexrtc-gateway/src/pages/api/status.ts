import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { error } = await supabase.from('app_logs').select('id').limit(1);
    if (error) throw error;
    return res.status(200).json({ running: true, database: true });
  } catch (err: any) {
    return res.status(500).json({ running: true, database: false, error: err.message });
  }
}
