// scripts/seed-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/features/auth/auth.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await User.findOne({ email: 'admin@zaynarah.com' });
  if (exists) {
    console.log('Admin exists');
    process.exit(0);
  }
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Admin123!', 10);
  await User.create({
    name: 'Admin',
    email: 'admin@zaynarah.com',
    passwordHash: hash,
    isAdmin: true,
  });
  console.log('Admin created: admin@zaynarah.com / Admin123!');
  process.exit(0);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
