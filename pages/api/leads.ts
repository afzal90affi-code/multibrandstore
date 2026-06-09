import type { NextApiRequest, NextApiResponse } from 'next';
import { writeClient } from '../../lib/sanity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { name, phone, city, need, source } = req.body;

    await writeClient.create({
      _type: 'lead',
      name,
      phone,
      city: city || '',
      need: need || '',
      source: source || 'website',
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Lead Error:', error);
    res.status(500).json({ error: 'Failed to save lead' });
  }
}