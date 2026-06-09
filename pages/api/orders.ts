import type { NextApiRequest, NextApiResponse } from 'next';
import { writeClient } from '../../lib/sanity'; // ✅ Yeh token wala secure client hai

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const orderData = req.body;

    // ✅ Sanity mein Order document create karna
    const doc = await writeClient.create({
      _type: 'order',
      customerName: orderData.customerName, 
      customerPhone: orderData.customerPhone, 
      customerCity: orderData.customerCity,
      customerAddress: orderData.customerAddress, 
      paymentMethod: orderData.paymentMethod,
      // Array of items nested object
      items: orderData.items.map((item: any) => ({
        _key: Math.random().toString(36).substr(2, 9), // Sanity array ke liye unique key
        _type: 'orderItem',
        title: item.title, 
        size: item.size, 
        qty: item.qty, 
        price: item.price
      })),
      totalAmount: orderData.totalAmount, 
      status: orderData.status || 'Pending', 
      orderedAt: new Date().toISOString() // Firebase timestamp ki jagah ISO string
    });

    res.status(200).json({ success: true, orderId: doc._id });
  } catch (error) {
    console.error('Sanity Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save order in Sanity' });
  }
}