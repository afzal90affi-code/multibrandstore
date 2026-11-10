// FILE: pages/api/categories.ts  (PURANA PURA CODE REPLACE KARO)
import type { NextApiRequest, NextApiResponse } from "next";
import { writeClient } from "../../lib/sanity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ 1. DELETE Request (With Exact Error Tracking)
  if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Category ID is required" });
    }

    try {
      console.log(`Attempting to delete category ID: ${id}`);
      await writeClient.delete(id);
      console.log(`Successfully deleted category ID: ${id}`);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("❌ CATEGORY DELETE ERROR:", error);
      return res.status(500).json({ error: error.message || "Failed to delete category" });
    }
  }

  // ✅ 2. POST Request (Category Add karne ke liye)
  else if (req.method === "POST") {
    try {
      const { name, icon, image, active, description } = req.body;

      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }

     
        const doc: { _type: string; [key: string]: any } = {
        _type: "category",
        name: String(name).trim(),
        icon: icon || "📦",
        active: active !== false,
        image: image ? { _type: "image", asset: { _type: "reference", _ref: image } } : undefined,
      };

      // SEO description (optional)
      if (typeof description === "string" && description.trim()) {
        doc.description = description.trim();
      }

      const created = await writeClient.create(doc);
      return res.status(200).json({ success: true, data: created });
    } catch (error) {
      console.error("Category Create Error:", error);
      return res.status(500).json({ error: "Failed to create category" });
    }
  }

  // ✅ 3. PUT Request (Category Update karne ke liye)
  else if (req.method === "PUT") {
    try {
      const { id, imageAssetId, description, ...updates } = req.body;

      if (!id) return res.status(400).json({ error: "Category ID is required" });

      // Naya image => Sanity reference format
      if (imageAssetId) {
        updates.image = { _type: "image", asset: { _type: "reference", _ref: imageAssetId } };
      }

      // SEO description — likha ho to trim karke save, khali bheja to field clear
      if (typeof description === "string") {
        updates.description = description.trim();
      }

      await writeClient.patch(id).set(updates).commit();
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Category Update Error:", error);
      return res.status(500).json({ error: "Failed to update category" });
    }
  }

  // ✅ 4. Agar koi aur method ho
  else {
    res.status(405).end();
  }
}