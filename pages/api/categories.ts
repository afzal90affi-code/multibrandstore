import type { NextApiRequest, NextApiResponse } from 'next';
import { writeClient } from '../../lib/sanity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    // ✅ DELETE Request (With Exact Error Tracking)
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    try {
      console.log(`Attempting to delete category ID: ${id}`);
      await writeClient.delete(id);
      console.log(`Successfully deleted category ID: ${id}`);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('❌ CATEGORY DELETE ERROR:', error);
      // ✅ Exact Sanity error frontend ko bhejna
      return res.status(500).json({ error: error.message || 'Failed to delete category' });
    }
  }
 

  // ✅ 2. POST Request (Category Add karne ke liye)
  else if (req.method === 'POST') {
    try {
      const { name, icon, image, active } = req.body;

      const doc = await writeClient.create({
        _type: 'category',
        name,
        icon: icon || '📦',
        active: active !== false,
        image: image ? { _type: 'image', asset: { _ref: image } } : undefined,
      });

      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      console.error('Category Create Error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }

  // ✅ 3. PUT Request (Category Update karne ke liye)
  else if (req.method === 'PUT') {
    try {
      const { id, imageAssetId, ...updates } = req.body;

      if (!id) return res.status(400).json({ error: 'Category ID is required' });

      // Agar naya image upload hua hai toh usko Sanity reference format mein badlen
      if (imageAssetId) {
        updates.image = { _type: 'image', asset: { _ref: imageAssetId } };
      }

      await writeClient.patch(id).set(updates).commit();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Category Update Error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }

  // ✅ 4. Agar koi aur method ho
  else {
    res.status(405).end();
  }
}