/**
 * Admin Seed Script
 * Run: node scripts/seed.js
 * Creates the initial admin user and default categories.
 * Reads credentials from .env - never hardcode passwords here.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config({ path: new URL('../.env', import.meta.url) });

import User from '../models/User.js';
import Category from '../models/Category.js';

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing required env vars: MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const DEFAULT_CATEGORIES = [
  { name: 'Technology', slug: 'technology', color: '#6366f1', description: 'Tech news and tutorials' },
  { name: 'Startup', slug: 'startup', color: '#f59e0b', description: 'Startup stories and advice' },
  { name: 'Lifestyle', slug: 'lifestyle', color: '#10b981', description: 'Lifestyle and personal development' },
  { name: 'Finance', slug: 'finance', color: '#3b82f6', description: 'Personal finance and investing' },
  { name: 'Health', slug: 'health', color: '#ef4444', description: 'Health and wellness' },
  { name: 'Travel', slug: 'travel', color: '#8b5cf6', description: 'Travel stories and guides' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Create admin user
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`✅ Updated ${ADMIN_EMAIL} to admin role`);
    } else {
      console.log(`ℹ️  Admin user ${ADMIN_EMAIL} already exists`);
    }
  } else {
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
  }

  // Create default categories
  for (const cat of DEFAULT_CATEGORIES) {
    const exists = await Category.findOne({ slug: cat.slug });
    if (!exists) {
      await Category.create(cat);
      console.log(`✅ Category created: ${cat.name}`);
    } else {
      console.log(`ℹ️  Category already exists: ${cat.name}`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ Seeding complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
