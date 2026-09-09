import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ensenai.app',
  appName: 'EnseñAI',
  webDir: 'www',
  // Dominios externos a los que la app necesita poder navegar completamente
  // (además de las llamadas fetch/XHR normales, que no requieren esto).
  server: {
    androidScheme: 'https',
    // Sin esto, el WebView sirve la app desde el origen por defecto
    // (https://localhost), que no está en la lista blanca de CORS del
    // backend ni de Supabase — por eso adentro de la app las llamadas a
    // la API fallaban ("Cargando..." infinito, "No se pudo cargar tu
    // historial") aunque en la web normal funcionaran bien. Con esto el
    // WebView se sirve como si fuera https://ensenai.com, que sí está
    // permitido en ambos lados.
    hostname: 'ensenai.com',
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
    },
    StatusBar: {
      // Evita que la barra de estado (reloj, batería, señal) se dibuje
      // encima del encabezado de la app — era la causa de que "EnseñAI"
      // se viera empalmado con la hora arriba de la pantalla.
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#1E3A8A'
    }
  }
};

export default config;
