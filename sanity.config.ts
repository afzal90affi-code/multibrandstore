// lib/sanity.ts
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "vieoyox0";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN || "";

// ✅ 1. Read Client
export const client = createClient({
  projectId: projectId,
  dataset: dataset,
  useCdn: false, // ⬅️ YEH TRUE SE FALSE KAR DEIN
  apiVersion: '2023-01-01',
});

// ✅ 2. Write Client
export const writeClient = createClient({
  projectId: projectId,
  dataset: dataset,
  token: token, 
  useCdn: false, // Yeh already false hai
  apiVersion: '2023-01-01',
});

const builder = imageUrlBuilder(client);
export const urlFor = (source: any) => {
  return builder.image(source);
};