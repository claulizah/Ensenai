# EnseñAI — App (Capacitor)

Este proyecto envuelve el sitio actual de EnseñAI (`www/`, copiado del repo
`claulizah/Ensenai`) con [Capacitor](https://capacitorjs.com) para generar
apps nativas de Android e iOS a partir del mismo HTML/CSS/JS que ya usa la
web. El sitio sigue llamando a los mismos servicios de siempre:

- Backend: `https://ensenai-backend.onrender.com`
- Auth/DB: Supabase (`https://azslvqfgeghhzghfxmdh.supabase.co`)

No se cambió nada de esa lógica — la app es el mismo código, solo corre
dentro de un WebView nativo con acceso a APIs del sistema (compartir,
splash screen, etc.).

## Estructura

- `www/` — copia del sitio estático (es una **copia**, no un symlink, del
  contenido en la raíz del repo — `index.html`, `tema.html`, `grupo.html`,
  `assets/`, `hojas/`, `blog/`, etc.). Cada vez que cambie algo en la raíz
  del repo hay que volver a copiarlo aquí, por ejemplo:
  ```bash
  cd mobile-app
  rsync -a --delete --exclude 'www' --exclude 'node_modules' \
    --exclude 'android' --exclude 'ios' --exclude '.git' \
    --exclude 'mobile-app' --exclude 'README-APP.md' --exclude 'README.md' \
    --exclude 'LEEME.txt' ../ www/
  npx cap sync
  ```
  (si no tienen `rsync`, un `cp -r ../*.html ../*.js ../assets ../hojas ../blog www/`
  hace lo mismo de forma más manual). Vale la pena automatizar esto con un
  GitHub Action más adelante para que `www/` nunca quede desactualizado.
- `android/` — proyecto nativo de Android (Android Studio / Gradle).
- `ios/` — proyecto nativo de iOS (Xcode).
- `capacitor.config.ts` — configuración de Capacitor (appId, nombre,
  dominios permitidos para navegación completa, splash screen).

## Requisitos

- Node.js 18+ y npm (ya usado para generar este proyecto).
- Para Android: [Android Studio](https://developer.android.com/studio)
  (incluye el SDK y Gradle).
- Para iOS: una Mac con [Xcode](https://developer.apple.com/xcode/) 15+ y
  CocoaPods (`sudo gem install cocoapods`). iOS **no se puede compilar**
  desde Linux/Windows — solo Apple lo permite en macOS.

## Flujo de trabajo

Cada vez que el sitio original (`www/`) cambie:

```bash
npm install        # solo la primera vez
npx cap sync        # copia www/ a android/ e ios/ y actualiza plugins
```

### Android

```bash
npx cap open android
```

Esto abre Android Studio. Desde ahí puedes correr la app en un emulador o
dispositivo (▶ Run), y cuando esté lista generar un APK/AAB firmado desde
Build → Generate Signed Bundle/APK para subirlo a Google Play Console.

### iOS (requiere Mac)

```bash
cd ios/App
pod install
cd ../..
npx cap open ios
```

Esto abre Xcode. Selecciona tu equipo de desarrollador (Signing &
Capabilities), corre en un simulador o dispositivo, y usa Product →
Archive para subir a App Store Connect (TestFlight / App Store).

## Cosas a revisar antes de publicar

1. **Ícono y splash screen**: por ahora se usa el ícono por defecto de
   Capacitor. Hay que generar los íconos reales a partir del logo de
   EnseñAI (`www/assets/favicon-180.png` como punto de partida) con una
   herramienta como `@capacitor/assets`:
   ```bash
   npm install @capacitor/assets --save-dev
   npx capacitor-assets generate
   ```
2. **Compras/suscripciones dentro de la app**: si el plan es vender
   suscripciones *dentro* de la app de iOS/Android, Apple y Google exigen
   usar su propio sistema de pagos (con comisión) para contenido digital.
   La alternativa más simple es que la app solo permita *iniciar sesión*
   y *consumir* lo que el usuario ya compró desde la web
   (`comprador.html`), sin botones de compra dentro de la app — esto
   evita el requisito de "in-app purchase" en la mayoría de los casos,
   pero conviene confirmarlo con las políticas vigentes de cada tienda
   antes de enviar la app a revisión.
3. **Impresión de hojas (`imprimible.js`)**: dentro de un WebView nativo
   `window.print()` no siempre abre un diálogo de impresión del sistema.
   Vale la pena probarlo y, si hace falta, usar el plugin
   `@capacitor/share` (ya instalado) para "compartir/guardar como PDF"
   en vez de imprimir directamente.
4. **Dominios permitidos**: si agregan un dominio nuevo (por ejemplo un
   backend distinto), hay que añadirlo a `allowNavigation` en
   `capacitor.config.ts` y correr `npx cap sync` de nuevo.
5. **Nombre de paquete**: se usó `com.ensenai.app` como `appId` — este
   identificador es el que usan las tiendas para reconocer la app y
   **no se puede cambiar después de publicarla**, así que confírmenlo
   antes del primer release.
