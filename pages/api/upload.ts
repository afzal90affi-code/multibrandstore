import type { NextApiRequest, NextApiResponse } from 'next';
import { writeClient } from '../../lib/sanity';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
   const form = new IncomingForm({ keepExtensions: true });

    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        console.error("❌ FORMIDABLE PARSE ERROR:", err);
        return res.status(500).json({ error: 'File parse error: ' + err.message });
      }

      const file = files.image ? (Array.isArray(files.image) ? files.image[0] : files.image) : null;

      if (!file) {
        return res.status(400).json({ error: 'No image found in request' });
      }

      const filePath = file.filepath || file.path;

      try {
        const asset = await writeClient.assets.upload('image', fs.createReadStream(filePath), {
          filename: file.originalFilename || 'upload.jpg',
        });
        
        // ✅ Success
        res.status(200).json({ assetId: asset._id, url: asset.url });

      } catch (sanityErr: any) {
        // ✅ AGAR SANITY MEIN ERROR AAYA TOH YEH FRONTEND KO EXACT ERROR BHEJEGA
        console.error("❌ SANITY ASSET UPLOAD ERROR:", sanityErr);
        return res.status(500).json({ error: `Sanity Error: ${sanityErr.message || 'Upload failed'}` });
      }
    });
  } catch (error: any) {
    console.error("❌ GENERAL API ERROR:", error);
    res.status(500).json({ error: 'General upload failed' });
  }
}