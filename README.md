# Vorbi

Deutsch für Alltag, für Rumänischsprachige: Live-Sprachgespräche mit Gemini Live (Deutsch/Rumänisch),
Dolmetscher-Modus, lokales Vokabeltraining. Keine Konten, alle Daten bleiben auf dem Gerät.

## Start

```
npm install
cp .env.example .env     # GEMINI_API_KEY eintragen (.env ist git-ignoriert)
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
