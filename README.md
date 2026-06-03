# SoleVault — Sneaker Portfolio Tracker

Een live sneaker portfolio tracker met AI-powered marktprijzen via de Anthropic API.

## Deployment op Vercel (stap voor stap)

### 1. GitHub repository aanmaken
1. Ga naar [github.com](https://github.com) en maak een gratis account aan
2. Klik op **New repository**
3. Naam: `solevault`
4. Klik **Create repository**
5. Upload alle bestanden uit deze map naar de repo (sleep ze naar de GitHub interface)

### 2. Vercel deployen
1. Ga naar [vercel.com](https://vercel.com) en maak een gratis account aan (log in via GitHub)
2. Klik **Add New Project**
3. Selecteer je `solevault` repository
4. Klik **Deploy** — Vercel herkent Next.js automatisch

### 3. Anthropic API key instellen
1. Ga naar [console.anthropic.com](https://console.anthropic.com) en maak een account aan
2. Ga naar **API Keys** en maak een nieuwe key aan
3. Ga in Vercel naar je project → **Settings** → **Environment Variables**
4. Voeg toe:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** jouw API key (begint met `sk-ant-...`)
5. Klik **Save** en herstart de deployment via **Deployments** → **Redeploy**

### Klaar!
Je app is live op `https://solevault-xxx.vercel.app`

## Lokaal draaien (optioneel)
```bash
npm install
# Maak .env.local aan met: ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Features
- Live marktprijzen ophalen via AI (Anthropic Claude)
- Per sneaker of alles tegelijk updaten
- Filter op verkoopadvies
- Directe links naar StockX en Klekt
- Data opgeslagen in localStorage (blijft bewaard)
- "Laatste update" timestamp per sneaker
