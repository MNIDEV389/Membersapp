import config from './src/payload.config.js';
import { getPayload } from 'payload';

async function test() {
  const payload = await getPayload({ config });
  try {
    const res = await payload.login({
      collection: 'members',
      data: {
        email: 'shivani@example.com',
        password: 'Member@MNI2026!'
      }
    });
    console.log('LOCAL PAYLOAD LOGIN SUCCESS:', res.user.email);
  } catch (err) {
    console.error('LOCAL PAYLOAD LOGIN ERROR:', err.message);
  }
  process.exit(0);
}

test();
