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

Bookmarks are automatically saved to `bookmarks.db` in the project directory. The database will be created on first run and migrated automatically if you're upgrading from an older version.

The app performs incremental fetching - on subsequent runs, it only fetches bookmarks that have been updated since the last sync, making it much faster.

## Development

- `npm run build` - Build TypeScript
- `npm test` - Run tests
