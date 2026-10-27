import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    console.warn('[DB] Server will continue running without database. API routes requiring MongoDB will fail until connected.');
  }
}
