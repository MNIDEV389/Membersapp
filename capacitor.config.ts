import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'network.mni.members',
  appName: 'MNI Members',
  webDir: 'out',
  server: {
    // For local dev / testing or point to production URL
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true,
  },
};

export default config;
