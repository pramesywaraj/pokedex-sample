import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pokedex.app',
  appName: 'Pokédex',
  webDir: 'dist/pokedex/browser',
  plugins: {
    SplashScreen: {
      // The app takes the cover down itself once it has bootstrapped, so this
      // duration is only the backstop for a launch that never gets that far.
      launchShowDuration: 3000,
      // Matches the fade the web overlay uses, so the two leave together.
      launchFadeOutDuration: 200,
      backgroundColor: '#DC0A2D',
      showSpinner: false,
    },
  },
};

export default config;
