import mongoose from 'mongoose';
import dns from 'node:dns';
import { config } from './config.js';

let connectionPromise;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    if (config.mongoDnsServers.length > 0) {
      dns.setServers(config.mongoDnsServers);
    }

    connectionPromise = mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      minPoolSize: 0,
      socketTimeoutMS: 45000,
    }).then((connection) => {
      console.log(`[DB] MongoDB connected: ${connection.connection.host}`);
      return connection;
    }).catch((error) => {
      console.error(`[DB] MongoDB connection failed: ${error.name}${error.code ? ` (${error.code})` : ''}`);
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}
