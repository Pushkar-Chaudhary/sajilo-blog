import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',
  mongoDnsServers: process.env.MONGODB_DNS_SERVERS
    ? process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
    : [],
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminName: process.env.ADMIN_NAME || 'Admin',
};

export function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  if (process.env.NODE_ENV === 'production') {
    required.push('FRONTEND_URL', 'BLOB_READ_WRITE_TOKEN');
  }
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[ENV] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[ENV] Configure the required environment variables before starting the server.');
    process.exit(1);
  }

  if (config.jwtSecret.length < 32) {
    console.error('[ENV] JWT_SECRET must contain at least 32 characters.');
    process.exit(1);
  }

  try {
    const frontendUrl = new URL(config.frontendUrl);
    if (config.nodeEnv === 'production' && frontendUrl.protocol !== 'https:') {
      throw new Error('Production FRONTEND_URL must use HTTPS.');
    }
  } catch (error) {
    console.error(`[ENV] Invalid FRONTEND_URL: ${error.message}`);
    process.exit(1);
  }

}
