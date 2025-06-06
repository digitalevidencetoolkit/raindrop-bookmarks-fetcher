# Raindrop Fetcher

A Node.js application that fetches and stores bookmarks from your Raindrop.io account locally in a SQLite database.

## Prerequisites

- Have working install of both Node.js (v22 or higher) and npm
- Have a Raindrop.io account, as well as [a Raindrop app](https://app.raindrop.io/settings/integrations) (with Client ID and Client secret)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Authentication

Create a `.env` file in the project root with your Raindrop.io API credentials:

```env
RAINDROP_CLIENT_ID=your_client_id
RAINDROP_CLIENT_SECRET=your_client_secret
RAINDROP_REDIRECT_URI=http://localhost:3000/callback
```

> **Note:** You'll need to create [a Raindrop.io app](https://app.raindrop.io/settings/integrations) in your account settings to get these credentials.

### 3. Authenticate

Run the authentication process:

```bash
npm run auth
```

This starts a local server, opens the auth URL, and automatically saves your tokens when you authorize the app.

### 4. Fetch Your Bookmarks

```bash
npm run fetch
```

## Sample Output

### First Run

```
🔄 Starting bookmark fetch...
📥 Fetched 150 bookmarks from Raindrop.io
💾 Saved 150 new bookmarks to database
✅ Sync completed successfully
```

### Subsequent Runs (Incremental Sync)

```
🔄 Starting incremental bookmark fetch...
📥 Fetched 5 new/updated bookmarks since last sync
💾 Saved 5 bookmarks to database
✅ Sync completed successfully
```

### Database Migration (When Upgrading)

```
🔄 Migrating database schema...
⚠️  Found 1 existing bookmarks. Note: Migration will lose old bookmarks as they lack raindrop_metadata.
Consider re-running the fetch to populate with complete Raindrop data.
✅ Database migration completed
```

## Available Commands

### Core Commands

- `npm run auth` - Authenticate with Raindrop.io
- `npm run fetch` - Fetch bookmarks from Raindrop.io
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run the test suite

## Data Storage

- Bookmarks are stored in `bookmarks.db` (SQLite database)
- Authentication tokens are saved in `tokens.json`
- Both files are created automatically on first run

### Database Schema

The SQLite database stores bookmarks with this schema:

```sql
CREATE TABLE bookmarks (
  raindrop_id INTEGER PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  raindrop_metadata TEXT NOT NULL
);
```

### Data Structures

#### Raindrop Link Object
```json
{
  "_id": 123456789,
  "title": "Example Article Title",
  "link": "https://example.com/article",
  "excerpt": "Brief description of the content...",
  "note": "Personal notes about this bookmark",
  "type": "article",
  "user": { "$id": 12345 },
  "cover": "https://example.com/cover.jpg",
  "media": [
    {
      "link": "https://example.com/image.jpg",
      "type": "image"
    }
  ],
  "tags": ["programming", "javascript"],
  "important": false,
  "removed": false,
  "created": "2024-01-15T10:30:00.000Z",
  "lastUpdate": "2024-01-15T10:30:00.000Z",
  "domain": "example.com",
  "collectionId": 98765
}
```

#### Authentication Tokens
```json
{
  "accessToken": "your_access_token_here",
  "refreshToken": "your_refresh_token_here", 
  "expiresAt": 1705123456789
}
```

## Features

- **Incremental Sync**: Only fetches bookmarks updated since last run
- **Automatic Migration**: Database schema updates automatically
- **Complete Metadata**: Preserves all Raindrop.io bookmark data
- **Local Storage**: All data stored locally in SQLite

## Test Results

```
Test Suites: 5 passed, 5 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        2.271 s
```

## Troubleshooting

### Authentication Issues

- Verify your `.env` file has correct credentials
- Check that your Raindrop.io app has the correct redirect URI
- Ensure `tokens.json` exists and is valid

### Database Issues

- Delete `bookmarks.db` to start fresh
- Run migration will automatically handle schema updates
- Check file permissions if getting write errors

## Project Structure

```
src/
├── api/          # Raindrop.io API client
├── auth/         # OAuth authentication
├── storage/      # SQLite database operations
├── types/        # TypeScript type definitions
└── __tests__/    # Test files
```