// lib/sanity.ts
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// ✅ 1. Read Client (Frontend/Website ke liye - CDN se fast data read hoga)
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: true, // Fast loading
  apiVersion: '2023-01-01',
});

// ✅ 2. Write Client (Sirf API Routes ke liye - Token ki wajah se secure)
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN!, // Yeh secret hai
  useCdn: false, // Write operations mein CDN use nahi karte
  apiVersion: '2023-01-01',
});

// ✅ 3. Image URL Builder (Sanity ki images ka URL generate karne ke liye)
const builder = imageUrlBuilder(client);
export const urlFor = (source: any) => {
  return builder.image(source);
};