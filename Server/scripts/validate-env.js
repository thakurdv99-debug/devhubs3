import dotenv from 'dotenv';

dotenv.config();

const required = ['JWT_SECRET', 'MONGODB_URI'];
const missing = required.filter(k => !process.env[k]);

if (missing.length) {
  console.error('Missing env vars:', missing);
  process.exit(1);
} else {
  console.log('All required env vars present');
}

