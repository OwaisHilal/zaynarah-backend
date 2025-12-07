// src/scripts/seedProducts.js
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Product = require('../features/products/products.model');

// --- MongoDB connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zaynarah';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// --- Generate a single product ---
function generateProduct(i) {
  return {
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: Number(faker.commerce.price({ min: 50, max: 5000, dec: 0 })),
    images: [`https://picsum.photos/400/400?random=${i}`], // placeholder image
    variants: [],
    metadata: {},
    stock: faker.number.int({ min: 0, max: 50 }), // ✅ updated
    category: faker.helpers.arrayElement([
      'Shawl',
      'Stole',
      'Scarf',
      'Wrap',
      'Pashmina',
    ]),
  };
}

// --- Seed products ---
async function seedProducts() {
  try {
    console.log('Clearing existing products...');
    await Product.deleteMany({});

    const products = [];
    const TOTAL = 1000;

    console.log(`Seeding ${TOTAL} products...`);
    for (let i = 1; i <= TOTAL; i++) {
      products.push(generateProduct(i));
    }

    await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${TOTAL} products!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

seedProducts();
