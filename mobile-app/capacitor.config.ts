import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ensenai.app',
  appName: 'EnseñAI',
  webDir: 'www',
  // Dominios externos a los que la app necesita poder navegar completamente
  // (además de las llamadas fetch/XHR normales, que no requieren esto).
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'ensenai.com',
      '*.ensenai.com',
      'ensenai-backend.onrender.com',
      'azslvqfgeghhzghfxmdh.supabase.co'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#1E3A8A',
      showSpinner: false
    }
  }
};

export default config;
