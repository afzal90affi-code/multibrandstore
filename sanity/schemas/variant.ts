export default {
  name: "variant",
  title: "Variant (Print/Color)",
  type: "object",
  fields: [
    { name: "printName", title: "Print / Color ka Naam", type: "string" },
    { name: "image", title: "Photo", type: "image" },
    { name: "inStock", title: "Stock me hai?", type: "boolean", initialValue: true },
    { name: "price", title: "Price (agar alag ho, warna khali)", type: "number" },
  ],
  preview: { select: { title: "printName", media: "image" } },
};