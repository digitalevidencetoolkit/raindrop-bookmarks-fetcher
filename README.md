# Raindrop Bookmarks Fetcher

A Node.js application that fetches bookmarks from your Raindrop.io account(s) and stores them as timestamped JSON files, designed for automated GitHub Actions workflows. Supports both single and multi-account configurations.

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

### Single Account Configuration

#### Required GitHub Secrets

To enable automated fetching for a single account, configure these secrets in your GitHub repository:

1. **Go to your repository** → Settings → Secrets and variables → Actions
2. **Add the following Repository Secrets:**

| Secret Name              | Description                        | How to Get It                                                                       |
| ------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `RAINDROP_CLIENT_ID`     | Your Raindrop.io app client ID     | From [Raindrop.io integrations page](https://app.raindrop.io/settings/integrations) |
| `RAINDROP_CLIENT_SECRET` | Your Raindrop.io app client secret | From [Raindrop.io integrations page](https://app.raindrop.io/settings/integrations) |
| `RAINDROP_ACCESS_TOKEN`  | OAuth access token                 | Run `npm run auth` locally, then copy from `tokens.json`                            |
| `RAINDROP_REFRESH_TOKEN` | OAuth refresh token                | Run `npm run auth` locally, then copy from `tokens.json`                            |
| `RAINDROP_EXPIRES_AT`    | Token expiration timestamp         | Run `npm run auth` locally, then copy from `tokens.json`                            |

#### Getting OAuth Tokens

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

### Multi-Account Configuration

To fetch bookmarks from multiple Raindrop accounts simultaneously:

1. **Create a JSON array with your account configurations:**

   ```json
   [
     {
       "id": "account1-name",
       "clientId": "client_id_1",
       "clientSecret": "client_secret_1",
       "accessToken": "access_token_1",
       "refreshToken": "refresh_token_1",
       "expiresAt": 1234567890
     },
     {
       "id": "account2-name",
       "clientId": "client_id_2",
       "clientSecret": "client_secret_2",
       "accessToken": "access_token_2",
       "refreshToken": "refresh_token_2",
       "expiresAt": 1234567890
     }
   ]
   ```

2. **Minify the JSON** (remove whitespace):

   ```json
   [{"id":"account1-name","clientId":"client_id_1","clientSecret":"client_secret_1","accessToken":"access_token_1","refreshToken":"refresh_token_1","expiresAt":1234567890},{"id":"account2-name","clientId":"client_id_2","clientSecret":"client_secret_2","accessToken":"access_token_2","refreshToken":"refresh_token_2","expiresAt":1234567890}]
   ```

3. **Add to GitHub Secrets** as `RAINDROP_ACCOUNTS_JSON`

#### Account ID Field

The `id` field in each account configuration should be a unique identifier (e.g., username, team name). This will be included in each bookmark's JSON to track which account it came from.

#### Getting Tokens for Each Account

For each account, you need to:

1. Authenticate using that account's credentials
2. Run `npm run auth` with the account's `clientId` and `clientSecret`
3. Copy the tokens from the generated `tokens.json`

### Branch Strategy

- **`main` branch**: Contains the application code
- **`bookmarks-data` branch**: Contains the fetched bookmark JSON files
- **Data files**: Each bookmark stored as `data/{bookmark_id}.json` (e.g., `data/123456789.json`)

The workflow automatically merges code updates from `main` into `bookmarks-data` to keep the execution environment current.

### Manual Trigger

You can manually trigger the workflow from the GitHub Actions tab using the "Run workflow" button.

## 📁 Data Storage

### JSON File Format

Each bookmark is saved as an individual JSON file using its ID as the filename:

**File**: `data/123456789.json`

**Single Account:**

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

**Multi-Account** (includes `accountId` field):

```json
{
  "_id": 123456789,
  "title": "Example Article Title",
  "link": "https://example.com/article",
  "accountId": "account1-name",
  ...
}
```

### Incremental Fetching

- **First run**: Fetches all bookmarks
- **Subsequent runs**: Only fetches bookmarks updated since the last run
- **Detection**: Uses `lastUpdate` timestamp from the most recent JSON file
- **Multi-account**: Each account tracks its own last update timestamp

## 📊 Sample Output

### Single Account Mode

```bash
🚀 Starting bookmark fetch...
🔍 Environment check:
  - RAINDROP_ACCOUNTS_JSON exists: false
  - RAINDROP_CLIENT_ID exists: true
  - tokens.json exists: true
📋 Using single account mode
🔍 Fetching links updated since 2024-01-15T10:00:00Z...
✅ Successfully fetched 5 updated links
💾 Saving bookmarks to JSON files...
💾 Saved 3 bookmarks as individual files
⏭️ Skipped 2 unchanged bookmarks
✅ Saved 3 new/updated bookmarks as individual files
```

### Multi-Account Mode

```bash
🚀 Starting bookmark fetch...
🔍 Environment check:
  - RAINDROP_ACCOUNTS_JSON exists: true
  - RAINDROP_CLIENT_ID exists: true
  - tokens.json exists: false
📊 Found 2 account(s) configured

🔄 Processing account: account1-name
🔍 [account1-name] Fetching links updated since 2024-01-15T10:00:00Z...
✅ [account1-name] Successfully fetched 10 updated links
💾 [account1-name] Saved 8 new/updated bookmarks
⏭️  [account1-name] Skipped 2 existing bookmarks

🔄 Processing account: account2-name
🔍 [account2-name] Fetching all links (initial sync)...
✅ [account2-name] Successfully fetched 25 links
💾 [account2-name] Saved 25 new/updated bookmarks

📊 Multi-account summary:
   Total links fetched: 35
   Total saved: 33
   Total skipped: 2
```

## 🔧 Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## 📝 License

MIT
