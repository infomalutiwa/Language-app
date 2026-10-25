# Vorbi

Deutsch für Alltag, für Rumänischsprachige: Live-Sprachgespräche mit Gemini Live (Deutsch/Rumänisch),
Dolmetscher-Modus, lokales Vokabeltraining. Keine Konten, alle Daten bleiben auf dem Gerät.

## Start

```
npm install
# Key verschlüsselt ablegen (AES-256-GCM, scrypt):
GEMINI_API_KEY=... KEY_PASSPHRASE=<mind. 12 Zeichen> node scripts/encrypt-key.mjs   # gibt GEMINI_API_KEY_ENC aus
# GEMINI_API_KEY_ENC in .env, KEY_PASSPHRASE in .env.secret (beide git-ignoriert).
# Beim Hosting: GEMINI_API_KEY oder GEMINI_API_KEY_ENC + KEY_PASSPHRASE als Secrets setzen.
npm run build && npm start    # http://localhost:8787
npm run dev                   # Vite-Dev-Server (Port 5173) + API
```

Das Mikrofon erfordert HTTPS (oder localhost). Der API-Key bleibt auf dem Server; der Browser
erhält nur kurzlebige Gemini-Tokens (`/api/token`), die auf Szenario, Prompt und Restzeit begrenzt sind.

## Kosten-Limit

Pro Gerät `DAILY_SECONDS` (Standard 600 s) und pro IP `IP_DAILY_SECONDS` Live-Zeit pro Tag.
Ohne Konten ist das ein weiches Limit. Model-Namen sind per Env überschreibbar (Preview-Modelle ändern sich).

## Tests

`npm test`

## Android (APK / AAB)

Capacitor verpackt die Web-App. Die App ruft den gehosteten Server auf (Adresse beim Build per
`VITE_API_BASE=https://dein-server` oder später in den Optionen der App unter „Server-Adresse“).

```
export ANDROID_HOME=~/android-sdk      # SDK mit platform 36 + build-tools
# android/keystore.properties + android/vorbi-release.jks anlegen (siehe .gitignore; NICHT einchecken, sichern!)
VITE_API_BASE=https://dein-server npm run android
# -> android/app/build/outputs/apk/release/app-release.apk  (APK)
# -> android/app/build/outputs/bundle/release/app-release.aab  (Play Store)
```

Der Server erlaubt die Origins der App (`https://localhost`, `capacitor://localhost`); weitere über `ALLOWED_ORIGINS`.
