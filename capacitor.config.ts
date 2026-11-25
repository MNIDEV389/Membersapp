import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'network.mni.members',
  appName: 'MNI Members',
  webDir: 'out',
  server: {
    url: 'https://mni-members-app.vercel.app',
    cleartext: true,
  },
};

export default config;
