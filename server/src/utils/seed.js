require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const seed = async () => {
  try {
    await connectDB();
    const email = 'owner@groceryshop.com';
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Shop Owner',
        email,
        password: 'password123',
        shopName: 'Fresh Mart Grocery',
        shopAddress: '123 Market Street, City',
        shopPhone: '+91 9876543210',
        gstNumber: 'GSTIN12345',
      });
      console.log('Created demo user:', email, 'password: password123');
    } else {
      console.log('Demo user already exists');
    }

    const count = await Product.countDocuments({ ownerId: user._id });
    if (count === 0) {
      const products = [
        { name: 'Rice', category: 'Grains', purchasePrice: 40, sellingPrice: 55, stock: 100, minimumStock: 20, unit: 'Kg' },
        { name: 'Potato', category: 'Vegetables', purchasePrice: 20, sellingPrice: 30, stock: 80, minimumStock: 15, unit: 'Kg' },
        { name: 'Onion', category: 'Vegetables', purchasePrice: 25, sellingPrice: 35, stock: 70, minimumStock: 15, unit: 'Kg' },
        { name: 'Milk', category: 'Dairy', purchasePrice: 45, sellingPrice: 54, stock: 50, minimumStock: 10, unit: 'Litre' },
        { name: 'Biscuits', category: 'Snacks', purchasePrice: 10, sellingPrice: 15, stock: 120, minimumStock: 20, unit: 'Packet' },
        { name: 'Cooking Oil', category: 'Grocery', purchasePrice: 120, sellingPrice: 150, stock: 40, minimumStock: 8, unit: 'Litre' },
        { name: 'Sugar', category: 'Grocery', purchasePrice: 38, sellingPrice: 45, stock: 60, minimumStock: 10, unit: 'Kg' },
        { name: 'Soap', category: 'Personal Care', purchasePrice: 25, sellingPrice: 35, stock: 90, minimumStock: 15, unit: 'Piece' },
        { name: 'Tea', category: 'Beverages', purchasePrice: 80, sellingPrice: 110, stock: 35, minimumStock: 10, unit: 'Packet' },
        { name: 'Salt', category: 'Grocery', purchasePrice: 15, sellingPrice: 20, stock: 75, minimumStock: 10, unit: 'Packet' },
      ].map((p) => ({ ...p, ownerId: user._id }));
      await Product.insertMany(products);
      console.log('Seeded sample products');
    } else {
      console.log('Products already exist, skipping seed');
    }

    await mongoose.disconnect();
    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
