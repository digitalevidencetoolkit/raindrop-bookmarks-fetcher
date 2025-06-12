# Raindrop Bookmarks Fetcher

A Node.js application that fetches bookmarks from your Raindrop.io account and stores them as timestamped JSON files, designed for automated GitHub Actions workflows.

## 🚀 Quick Start (Local Development)

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

## 🤖 Automated GitHub Actions Setup

This project includes a GitHub Actions workflow that automatically fetches bookmarks and commits them to a separate `bookmarks-data` branch.

### Enabling Automatic Scheduling

By default, the workflow only runs manually. To enable automatic fetching every 6 hours:

1. **Edit `.github/workflows/fetch-bookmarks.yml`**
2. **Uncomment the schedule section:**
   ```yaml
   on:
     schedule:
       # Run every 6 hours
       - cron: "0 */6 * * *"
     workflow_dispatch: # Allow manual triggering
   ```
3. **Commit and push the changes**

⚠️ **Important**: Only enable the schedule after you've set up all the required GitHub Secrets (see below).

### Required GitHub Secrets

To enable automated fetching, you must configure these secrets in your GitHub repository:

1. **Go to your repository** → Settings → Secrets and variables → Actions
2. **Add the following Repository Secrets:**

| Secret Name              | Description                        | How to Get It                                                                       |
| ------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `RAINDROP_CLIENT_ID`     | Your Raindrop.io app client ID     | From [Raindrop.io integrations page](https://app.raindrop.io/settings/integrations) |
| `RAINDROP_CLIENT_SECRET` | Your Raindrop.io app client secret | From [Raindrop.io integrations page](https://app.raindrop.io/settings/integrations) |
| `RAINDROP_ACCESS_TOKEN`  | OAuth access token                 | Run `npm run auth` locally, then copy from `tokens.json`                            |
| `RAINDROP_REFRESH_TOKEN` | OAuth refresh token                | Run `npm run auth` locally, then copy from `tokens.json`                            |
| `RAINDROP_EXPIRES_AT`    | Token expiration timestamp         | Run `npm run auth` locally, then copy from `tokens.json`                            |

### Getting OAuth Tokens

1. **Set up local environment** (steps 1-3 above)
2. **Run authentication:**
   ```bash
   npm run auth
   ```
3. **Copy values from `tokens.json`:**
   ```json
   {
     "accessToken": "copy_this_to_RAINDROP_ACCESS_TOKEN",
     "refreshToken": "copy_this_to_RAINDROP_REFRESH_TOKEN",
     "expiresAt": "copy_this_to_RAINDROP_EXPIRES_AT"
   }
   ```

### Branch Strategy

- **`main` branch**: Contains the application code
- **`bookmarks-data` branch**: Contains the fetched bookmark JSON files
- **Data files**: Each bookmark stored as `data/{bookmark_id}.json` (e.g., `data/123456789.json`)

### Manual Trigger

You can manually trigger the workflow from the GitHub Actions tab using the "Run workflow" button.

## 📁 Data Storage

### JSON File Format

Each bookmark is saved as an individual JSON file using its ID as the filename:

**File**: `data/123456789.json`

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
  "creatorRef": "test",
  "sort": 0,
  "collectionId": 98765
}
```

### Incremental Fetching

- **First run**: Fetches all bookmarks
- **Subsequent runs**: Only fetches bookmarks updated since the last run
- **Detection**: Uses `lastUpdate` timestamp from the most recent JSON file

## 📊 Sample Output

### Local Development

```bash
🔍 Fetching links updated since 2024-01-15T10:00:00Z...
✅ Successfully fetched 5 updated links
💾 Saving bookmarks to JSON files...
💾 Saved 3 bookmarks as individual files
⏭️ Skipped 2 unchanged bookmarks
✅ Saved 3 new/updated bookmarks as individual files
```

### GitHub Actions

```
🚀 Starting bookmark fetch...
🔍 Fetching all links from Raindrop.io (initial sync)...
✅ Successfully fetched 150 links
💾 Saving bookmarks to JSON files...
💾 Saved 150 bookmarks as individual files
✅ Saved 150 new/updated bookmarks as individual files
📁 New bookmark data detected, committing...
✅ Successfully committed and pushed new bookmark data
```
