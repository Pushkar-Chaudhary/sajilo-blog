import dns from 'node:dns';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { config } from '../config/config.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(scriptDir, '../../.env');

function ask(question) {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => prompt.question(question, (answer) => {
    prompt.close();
    resolve(answer.trim());
  }));
}

function askSecret(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the password can be entered privately.');
  }

  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let value = '';
    const onData = (key) => {
      if (key === '\u0003') {
        process.stdin.off('data', onData);
        process.stdin.setRawMode(false);
        process.stdout.write('\n');
        reject(new Error('Password entry cancelled.'));
      } else if (key === '\r' || key === '\n') {
        process.stdin.off('data', onData);
        process.stdin.setRawMode(false);
        process.stdout.write('\n');
        resolve(value);
      } else if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
      } else if (key >= ' ' && key !== '\u007f') {
        value += key;
      }
    };

    process.stdin.on('data', onData);
  });
}

function quoteEnvValue(value) {
  return JSON.stringify(value);
}

function setEnvValue(content, key, value) {
  const line = `${key}=${quoteEnvValue(value)}`;
  const pattern = new RegExp(`^[ \\t]*(?:export[ \\t]+)?${key}[ \\t]*=.*$`, 'm');
  if (pattern.test(content)) return content.replace(pattern, line);
  const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  return `${content}${separator}${line}\n`;
}

async function writeEnvFile(content, mode) {
  const tempPath = `${envPath}.${process.pid}.tmp`;
  try {
    await fs.writeFile(tempPath, content, { encoding: 'utf8', mode: mode & 0o777 });
    await fs.rename(tempPath, envPath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

async function resetAdmin() {
  if (!config.mongoUri || !config.adminEmail) {
    throw new Error('MONGODB_URI and the current ADMIN_EMAIL must be configured in .env.');
  }

  const email = (await ask('New admin email: ')).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const password = await askSecret('New password (minimum 12 characters): ');
  const confirmation = await askSecret('Confirm new password: ');
  if (password.length < 12) throw new Error('The password must be at least 12 characters.');
  if (password !== confirmation) throw new Error('The passwords do not match.');
  if (/[\r\n]/.test(password)) throw new Error('The password cannot contain a newline.');

  const originalEnv = await fs.readFile(envPath, 'utf8');
  const envStat = await fs.stat(envPath);
  const updatedEnv = setEnvValue(
    setEnvValue(originalEnv, 'ADMIN_EMAIL', email),
    'ADMIN_PASSWORD',
    password
  );
  const parsedEnv = dotenv.parse(updatedEnv);
  if (parsedEnv.ADMIN_EMAIL !== email || parsedEnv.ADMIN_PASSWORD !== password) {
    throw new Error('The password contains characters that cannot be safely written to .env.');
  }

  if (config.mongoDnsServers.length > 0) dns.setServers(config.mongoDnsServers);
  await mongoose.connect(config.mongoUri);

  let envWasUpdated = false;
  try {
    const admin = await User.findOne({
      email: config.adminEmail.toLowerCase().trim(),
      role: 'admin',
    }).select('+password');
    if (!admin) throw new Error('The currently configured admin account was not found.');

    const emailInUse = await User.exists({ email, _id: { $ne: admin._id } });
    if (emailInUse) throw new Error('That email is already used by another account.');

    await writeEnvFile(updatedEnv, envStat.mode);
    envWasUpdated = true;

    admin.email = email;
    admin.password = password;
    await admin.save();

    console.log('Admin email and password updated. Restart the backend before signing in.');
  } catch (error) {
    if (envWasUpdated) {
      try {
        await writeEnvFile(originalEnv, envStat.mode);
      } catch {
        throw new Error('Admin update failed and .env could not be restored; inspect .env before restarting.');
      }
    }
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

resetAdmin().catch((error) => {
  console.error(`Admin reset failed: ${error.message}`);
  process.exitCode = 1;
});
