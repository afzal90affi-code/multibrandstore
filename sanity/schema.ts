// sanity/schema.ts
import { defineType, defineField } from 'sanity';

// ✅ 1. Category Schema
const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon (Emoji)',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
});

// ✅ 2. Sub-Category Schema (Parent Category ke saath link)
const subCategory = defineType({
  name: 'subCategory',
  title: 'Sub-Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon (Emoji)',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'parentCategory',
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});

// ✅ 3. Product Schema
const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (PKR)',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
    // 🆕 NEW: Product Details Added Here
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Product ki full detail — fabric, fit, care instructions etc.',
    }),
    defineField({
      name: 'highlights',
      title: 'Product Highlights',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Bullet points jaise "Premium quality fabric", "Stitching included"',
    }),
    defineField({
      name: 'material',
      title: 'Material',
      type: 'string',
      description: 'e.g. 100% Cotton, Lawn, Silk, Chiffon...',
    }),
    // 🆕 END: New Fields
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'subCategory',
      title: 'Sub-Category',
      type: 'reference',
      to: [{ type: 'subCategory' }],
      // ✅ BUG FIX: (: any) lagane se TS error nahi aayega aur _id == "none" safe filter hai
      options: {
        filter: ({ parent }: any) => {
          const parentCat = parent?.category?._ref;
          if (parentCat) {
            return {
              filter: 'parentCategory._ref == $parentCat',
              params: { parentCat }
            };
          }
          // Agar category select nahi hai toh sub-category list khali rahegi
          return { filter: '_id == "none"' };
        },
      },
    }),
    defineField({
      name: 'sizes',
      title: 'Sizes (e.g: S, M, L)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'image2',
      title: 'Hover / Second Image',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
});

// ✅ 4. Order Item Schema (Order ke andar jo products aayenge)
const orderItem = defineType({
  name: 'orderItem',
  title: 'Order Item',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Product Title', type: 'string' }),
    defineField({ name: 'size', title: 'Size', type: 'string' }),
    defineField({ name: 'qty', title: 'Quantity', type: 'number' }),
    defineField({ name: 'price', title: 'Price', type: 'number' }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'size',
    },
  },
});

// ✅ 5. Order Schema (WhatsApp order save karne ke liye)
const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    defineField({ name: 'customerName', title: 'Customer Name', type: 'string' }),
    defineField({ name: 'customerPhone', title: 'Phone', type: 'string' }),
    defineField({ name: 'customerCity', title: 'City', type: 'string' }),
    defineField({ name: 'customerAddress', title: 'Address', type: 'string' }),
    defineField({ name: 'paymentMethod', title: 'Payment Method', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [{ type: 'orderItem' }],
    }),
    defineField({ name: 'totalAmount', title: 'Total Amount', type: 'number' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'Pending',
      options: {
        list: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      },
    }),
    defineField({ name: 'orderedAt', title: 'Ordered At', type: 'datetime' }),
  ],
});

// ✅ 6. Lead Schema (Website Popup se jo data aata hai)
const lead = defineType({
  name: 'lead',
  title: 'Lead',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'city', title: 'City', type: 'string' }),
    defineField({ name: 'need', title: 'Need', type: 'string' }),
    defineField({ name: 'source', title: 'Source', type: 'string' }),
    defineField({ name: 'createdAt', title: 'Created At', type: 'datetime' }),
  ],
});

// ✅ Sabhi schemas ko export karna
export const schemaTypes = [
  category,
  subCategory,
  product,
  orderItem,
  order,
  lead, // ✅ Lead bhi export kar diya
];