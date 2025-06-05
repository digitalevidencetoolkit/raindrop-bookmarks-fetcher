# Raindrop Fetcher

A simple Node.js app that fetches bookmarks from your Raindrop.io account.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Raindrop.io credentials:
   ```
   RAINDROP_CLIENT_ID=your_client_id
   RAINDROP_CLIENT_SECRET=your_client_secret
   RAINDROP_REDIRECT_URI=http://localhost:3000/callback
   ```

3. Authenticate and save tokens to `tokens.json`

## Usage

Fetch all your bookmarks:
```bash
npm run fetch
```

## Development

- `npm run build` - Build TypeScript
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run typecheck` - Type check