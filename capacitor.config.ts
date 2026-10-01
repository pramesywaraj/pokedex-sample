import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pokedex.app',
  appName: 'Pokédex',
  webDir: 'dist/pokedex/browser',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#DC0A2D',
      showSpinner: false,
    },
  },
};

export default config;
