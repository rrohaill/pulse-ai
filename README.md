# Pulse AI

An AI-powered news aggregation dashboard that curates articles from RSS feeds, Reddit, Twitter/X, and GitHub. Uses a local AI model (Ollama + Llama 3.1) to score, filter, and summarize hundreds of articles into a personalized feed.

Available as a **macOS desktop app** with a built-in setup wizard, or as a **web app** you can self-host.

## Download

> **macOS Desktop App** - Download, install, and run. The setup wizard handles everything.

| Platform | Architecture | Download |
|----------|-------------|----------|
| macOS | Apple Silicon (M1/M2/M3/M4) | [Pulse AI-0.1.0-arm64.dmg](https://github.com/rrohaill/PulseAI/releases/latest/download/Pulse.AI-0.1.0-arm64.dmg) |

1. Download the `.dmg` file
2. Open it and drag **Pulse AI** to your Applications folder
3. Launch Pulse AI - the setup wizard will install Ollama and download the AI model automatically

## Demo

<video src="assets/demo.mp4" width="100%" autoplay loop muted playsinline></video>

## Features

- **Multi-source ingestion** - RSS feeds, Reddit, Twitter/X profiles, and GitHub trending
- **Local AI pipeline** - Ollama + Llama 3.1 for scoring, summarization, and tagging (no API keys needed)
- **Dynamic categories** - Auto-generated topic filters (AI & Tech, Politics, etc.) based on your sources
- **Bookmarks** - Save articles to read later with a dedicated Saved page
- **Trend analysis** - Weekly AI-generated trend reports from top articles
- **Desktop app** - Native macOS app via Electron with a first-run setup wizard
- **Dark theme** - Clean, modern UI inspired by Linear and Vercel

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite + Drizzle ORM |
| AI | Ollama (Llama 3.1) or OpenAI |
| Desktop | Electron |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |

## Getting Started

### Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com) (optional - the desktop app installs it for you)

### Web App (Development)

```bash
git clone https://github.com/your-username/pulse-ai.git
cd pulse-ai
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Desktop App (macOS)

```bash
npm install
npm run electron:dev
```

On first launch, the setup wizard will:

1. Check if Ollama is installed
2. Download and install Ollama if missing
3. Pull the Llama 3.1 model (~4.7 GB)
4. Launch the dashboard

### Build Desktop App (.dmg)

```bash
npm run electron:build
```

The `.dmg` will be in `dist-electron/`.

## Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# AI Provider: "ollama" (default, free) or "openai"
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# OpenAI (alternative)
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...

# Scoring
SCORE_THRESHOLD=60

# Ingestion
INGEST_INTERVAL_MINUTES=60
```

## Project Structure

```
src/
  app/            # Next.js pages and API routes
  components/     # React components (articles, filters, layout)
  lib/
    ai/           # AI provider, scoring, enrichment, trends
    db/           # SQLite schema and connection
    ingestion/    # RSS, Reddit, Twitter, GitHub fetchers
electron/
  main.js         # Electron main process
  setup.js        # Ollama installation logic
  setup.html      # First-run setup wizard
  preload.js      # IPC bridge
```

## License

MIT
