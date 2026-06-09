import type { NextApiRequest, NextApiResponse } from 'next';
import { writeClient } from '../../lib/sanity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  // ✅ Create Sub-Category
  if (req.method === 'POST') {
    try {
      const { name, icon, image, active, parentCategory } = req.body;
      
      const doc = await writeClient.create({
        _type: 'subCategory',
        name,
        icon: icon || '📦',
        active: active !== false,
        // ✅ Yeh Parent Category ko link karega
        parentCategory: parentCategory ? { _type: 'reference', _ref: parentCategory } : undefined,
        image: image ? { _type: 'image', asset: { _ref: image } } : undefined,
      });

      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      console.error('Sub-Category Create Error:', error);
      res.status(500).json({ error: 'Failed to create sub-category' });
    }
  }

  // ✅ Delete Sub-Category
  else if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'ID required' });
    try {
      await writeClient.delete(id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete' });
    }
  }

  // ✅ Update Sub-Category
  else if (req.method === 'PUT') {
    try {
      const { id, imageAssetId, parentCategory, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });

      if (imageAssetId) updates.image = { _type: 'image', asset: { _ref: imageAssetId } };
      if (parentCategory) updates.parentCategory = { _type: 'reference', _ref: parentCategory };

      await writeClient.patch(id).set(updates).commit();
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update' });
    }
  }

  else {
    res.status(405).end();
  }
}