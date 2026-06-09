import type { NextApiRequest, NextApiResponse } from 'next';
import { writeClient } from '../../lib/sanity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  // ✅ 1. DELETE Request (Product Delete karne ke liye)
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
      await writeClient.delete(id);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Product Delete Error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
  }

  // ✅ 2. POST Request (Product Add karne ke liye)
  else if (req.method === 'POST') {
    try {
      // 🆕 description, highlights, material bhi extract kiye
      const { title, price, category, subCategory, sizes, featured, inStock, image, image2, description, highlights, material } = req.body;
      
      const newProduct = await writeClient.create({
        _type: 'product',
        title,
        price: Number(price),
        category: category ? { _type: 'reference', _ref: category } : undefined,
        subCategory: subCategory ? { _type: 'reference', _ref: subCategory } : undefined,
        sizes: sizes || [],
        featured: featured || false,
        inStock: inStock !== false,
        image: image ? { _type: 'image', asset: { _ref: image } } : undefined,
        image2: image2 ? { _type: 'image', asset: { _ref: image2 } } : undefined,
        // 🆕 NEW: Product Details fields
        description: description || undefined,
        highlights: highlights && highlights.length > 0 ? highlights : undefined,
        material: material || undefined,
      });

      res.status(200).json({ success: true, data: newProduct });
    } catch (error: any) {
      console.error('Product Create Error:', error);
      res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  }

  // ✅ 3. PUT Request (Product Update karne ke liye)
  else if (req.method === 'PUT') {
    try {
      const { id, imageAssetId, image2AssetId, category, subCategory, ...updates } = req.body;
      
      if (!id) return res.status(400).json({ error: 'Product ID is required' });

      // Handle image updates
      if (imageAssetId) updates.image = { _type: 'image', asset: { _ref: imageAssetId } };
      if (image2AssetId) updates.image2 = { _type: 'image', asset: { _ref: image2AssetId } };

      // Handle reference updates
      if (category) updates.category = { _type: 'reference', _ref: category };
      if (subCategory) updates.subCategory = { _type: 'reference', _ref: subCategory };

      // 🆕 NOTE: description, highlights, aur material automatically `...updates` mein aa jayenge 
      // kyunki humne unhe destructure nahi kiya, toh unhe alag se handle karne ki zaroorat nahi hai!
      
      await writeClient.patch(id).set(updates).commit();
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Product Update Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update product' });
    }
  }
  
  // ✅ 4. Agar koi aur method ho
  else {
    res.status(405).end();
  }
}