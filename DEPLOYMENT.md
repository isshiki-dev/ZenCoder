# Deployment Guide

## Prerequisites
- Node.js 18+
- Neon Database account
- OpenCode Zen API Key

## Environment Variables
- DATABASE_URL: Connection string from Neon.
- OPENCODE_ZEN_API_KEY: API Key from OpenCode Zen.
- OPENCODE_ZEN_BASE_URL: (Optional) Base URL for the API.

## Build & Deploy
1. Install dependencies: `npm install`
2. Sync database: `npx prisma db push`
3. Build for production: `npm run build`
4. Start server: `npm start`
