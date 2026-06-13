import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const categories = ['Footwear', 'Electronics', 'Clothing', 'Accessories'];
const adjectives = ['Premium', 'Classic', 'Ultra', 'Pro', 'Lite', 'Sport', 'Urban', 'Eco'];
const nouns = {
  Footwear:    ['Sneaker', 'Boot', 'Sandal', 'Loafer', 'Runner'],
  Electronics: ['Headphone', 'Speaker', 'Charger', 'Keyboard', 'Monitor'],
  Clothing:    ['Jacket', 'T-Shirt', 'Hoodie', 'Jogger', 'Vest'],
  Accessories: ['Wallet', 'Belt', 'Watch', 'Bag', 'Cap'],
};

const products = Array.from({ length: 80 }, (_, i) => {
  const category = categories[i % 4];
  const name = `${adjectives[i % 8]} ${nouns[category][i % 5]} ${i + 1}`;
  return {
    name,
    description: `High quality ${category.toLowerCase()} product — ${name}.`,
    price: parseFloat((Math.random() * 200 + 10).toFixed(2)),
    category,
    stock: Math.random() > 0.25 ? Math.floor(Math.random() * 100) + 1 : 0,
  };
});

await mongoose.connect(process.env.MONGO_URI);
await Product.deleteMany({});
await Product.insertMany(products);
console.log('  Seeded 80 products');
mongoose.disconnect();