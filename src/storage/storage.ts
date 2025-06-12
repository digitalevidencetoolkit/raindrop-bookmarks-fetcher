import { promises as fs } from "fs";
import { join } from "path";
import { AuthTokens } from "../types/auth";
import { RaindropLink } from "../types/raindrop";
// import * as sqlite3 from "sqlite3";

const defaultTokensPath = join(process.cwd(), "tokens.json");

export async function saveTokens(
  tokens: AuthTokens,
  filePath: string = defaultTokensPath
): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(tokens, null, 2));
  } catch (error) {
    throw new Error(
      `Failed to save tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function loadTokens(
  filePath: string = defaultTokensPath
): Promise<AuthTokens | null> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as AuthTokens;
  } catch (error) {
    if ((error as any)?.code === "ENOENT") {
      return null;
    }
    throw new Error(
      `Failed to load tokens: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function clearTokens(
  filePath: string = defaultTokensPath
): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as any)?.code !== "ENOENT") {
      throw new Error(
        `Failed to clear tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export async function hasTokens(
  filePath: string = defaultTokensPath
): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Bookmark storage types
export interface StoredBookmark {
  raindrop_id: number;
  url: string;
  title: string;
  raindrop_metadata: RaindropLink;
}

// const defaultBookmarkDbPath = join(process.cwd(), "bookmarks.db");

// Helper functions to promisify SQLite operations
// function runQuery<T = any>(
//   db: sqlite3.Database,
//   query: string,
//   params: any[] = []
// ): Promise<T[]> {
//   return new Promise((resolve, reject) => {
//     db.all(query, params, (err: Error | null, rows: any[]) => {
//       if (err) reject(err);
//       else resolve(rows as T[]);
//     });
//   });
// }

// function runQuerySingle<T = any>(
//   db: sqlite3.Database,
//   query: string,
//   params: any[] = []
// ): Promise<T | null> {
//   return new Promise((resolve, reject) => {
//     db.get(query, params, (err: Error | null, row: any) => {
//       if (err) reject(err);
//       else resolve(row ? (row as T) : null);
//     });
//   });
// }

// function execQuery(
//   db: sqlite3.Database,
//   query: string,
//   params: any[] = []
// ): Promise<void> {
//   return new Promise((resolve, reject) => {
//     db.run(query, params, function (err: Error | null) {
//       if (err) reject(err);
//       else resolve();
//     });
//   });
// }

// Helper to open database connection
// function openDatabase(dbPath: string): Promise<sqlite3.Database> {
//   return new Promise((resolve, reject) => {
//     const db = new sqlite3.Database(dbPath, (err) => {
//       if (err) reject(err);
//       else resolve(db);
//     });
//   });
// }

// Helper to close database connection
// function closeDatabase(db: sqlite3.Database): Promise<void> {
//   return new Promise((resolve, reject) => {
//     db.close((err) => {
//       if (err) reject(err);
//       else resolve();
//     });
//   });
// }

// Check if database needs migration
// async function needsMigration(db: sqlite3.Database): Promise<boolean> {
//   try {
//     // Check if old schema exists by looking for the tags column
//     const result = await runQuery(db, `PRAGMA table_info(bookmarks)`);

//     // If bookmarks table doesn't exist, no migration needed
//     if (result.length === 0) {
//       return false;
//     }

//     // Check if old columns exist
//     const hasTagsColumn = result.some((col: any) => col.name === "tags");
//     const hasMetadataColumn = result.some(
//       (col: any) => col.name === "metadata"
//     );
//     const hasFetchedAtColumn = result.some(
//       (col: any) => col.name === "fetched_at"
//     );

//     return hasTagsColumn || hasMetadataColumn || hasFetchedAtColumn;
//   } catch {
//     return false;
//   }
// }

// Migrate database from old schema to new schema
// async function migrateDatabase(db: sqlite3.Database): Promise<void> {
//   console.log("🔄 Migrating database schema...");

//   try {
//     await execQuery(db, "BEGIN TRANSACTION");

//     // Create new table with correct schema
//     await execQuery(
//       db,
//       `
//       CREATE TABLE IF NOT EXISTS bookmarks_new (
//         raindrop_id INTEGER PRIMARY KEY,
//         url TEXT NOT NULL UNIQUE,
//         title TEXT NOT NULL,
//         raindrop_metadata TEXT NOT NULL
//       )
//     `
//     );

//     // Check if old bookmarks table has data
//     const oldData = await runQuery(
//       db,
//       `SELECT COUNT(*) as count FROM bookmarks`
//     );

//     if (oldData[0]?.count > 0) {
//       console.log(
//         `⚠️  Found ${oldData[0].count} existing bookmarks. Note: Migration will lose old bookmarks as they lack raindrop_metadata.`
//       );
//       console.log(
//         "   Consider re-running the fetch to populate with complete Raindrop data."
//       );
//     }

//     // Drop old table and rename new one
//     await execQuery(db, "DROP TABLE IF EXISTS bookmarks");
//     await execQuery(db, "ALTER TABLE bookmarks_new RENAME TO bookmarks");

//     await execQuery(db, "COMMIT");
//     console.log("✅ Database migration completed");
//   } catch (error) {
//     await execQuery(db, "ROLLBACK");
//     throw error;
//   }
// }

// export async function initializeBookmarkDb(
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<void> {
//   const db = await openDatabase(dbPath);

//   try {
//     // Check if migration is needed
//     if (await needsMigration(db)) {
//       await migrateDatabase(db);
//     } else {
//       // Create table with new schema
//       await execQuery(
//         db,
//         `
//         CREATE TABLE IF NOT EXISTS bookmarks (
//           raindrop_id INTEGER PRIMARY KEY,
//           url TEXT NOT NULL UNIQUE,
//           title TEXT NOT NULL,
//           raindrop_metadata TEXT NOT NULL
//         )
//       `
//       );
//     }
//   } finally {
//     await closeDatabase(db);
//   }
// }

// export async function saveBookmark(
//   bookmark: {
//     raindropLink: RaindropLink;
//   },
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<void> {
//   const db = await openDatabase(dbPath);

//   try {
//     const raindropMetadataJson = JSON.stringify(bookmark.raindropLink);

//     await execQuery(
//       db,
//       `INSERT OR IGNORE INTO bookmarks (raindrop_id, url, title, raindrop_metadata)
//        VALUES (?, ?, ?, ?)`,
//       [
//         bookmark.raindropLink._id,
//         bookmark.raindropLink.link,
//         bookmark.raindropLink.title,
//         raindropMetadataJson,
//       ]
//     );
//   } finally {
//     await closeDatabase(db);
//   }
// }

// export async function getBookmark(
//   url: string,
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<StoredBookmark | null> {
//   const db = await openDatabase(dbPath);

//   try {
//     const row = await runQuerySingle<{
//       raindrop_id: number;
//       url: string;
//       title: string;
//       raindrop_metadata: string;
//     }>(
//       db,
//       `SELECT raindrop_id, url, title, raindrop_metadata
//        FROM bookmarks
//        WHERE url = ?`,
//       [url]
//     );

//     if (!row) return null;

//     return {
//       raindrop_id: row.raindrop_id,
//       url: row.url,
//       title: row.title,
//       raindrop_metadata: JSON.parse(row.raindrop_metadata),
//     };
//   } finally {
//     await closeDatabase(db);
//   }
// }

// export async function hasBookmarkUrl(
//   url: string,
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<boolean> {
//   const db = await openDatabase(dbPath);

//   try {
//     const row = await runQuerySingle<{ count: number }>(
//       db,
//       `SELECT COUNT(*) as count
//        FROM bookmarks
//        WHERE url = ?`,
//       [url]
//     );

//     return (row?.count || 0) > 0;
//   } finally {
//     await closeDatabase(db);
//   }
// }

// export async function hasBookmarkId(
//   raindropId: number,
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<boolean> {
//   const db = await openDatabase(dbPath);

//   try {
//     const row = await runQuerySingle<{ count: number }>(
//       db,
//       `SELECT COUNT(*) as count
//        FROM bookmarks
//        WHERE raindrop_id = ?`,
//       [raindropId]
//     );

//     return (row?.count || 0) > 0;
//   } finally {
//     await closeDatabase(db);
//   }
// }

// export async function getMostRecentUpdate(
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<string | null> {
//   const db = await openDatabase(dbPath);

//   try {
//     const row = await runQuerySingle<{ lastUpdate: string }>(
//       db,
//       `SELECT JSON_EXTRACT(raindrop_metadata, '$.lastUpdate') as lastUpdate
//        FROM bookmarks
//        ORDER BY JSON_EXTRACT(raindrop_metadata, '$.lastUpdate') DESC
//        LIMIT 1`
//     );

//     return row?.lastUpdate || null;
//   } finally {
//     await closeDatabase(db);
//   }
// }

// export async function getAllBookmarks(
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<StoredBookmark[]> {
//   const db = await openDatabase(dbPath);

//   try {
//     const rows = await runQuery<{
//       raindrop_id: number;
//       url: string;
//       title: string;
//       raindrop_metadata: string;
//     }>(
//       db,
//       `SELECT raindrop_id, url, title, raindrop_metadata
//        FROM bookmarks
//        ORDER BY raindrop_id DESC`
//     );

//     return rows.map((row) => ({
//       raindrop_id: row.raindrop_id,
//       url: row.url,
//       title: row.title,
//       raindrop_metadata: JSON.parse(row.raindrop_metadata),
//     }));
//   } finally {
//     await closeDatabase(db);
//   }
// }

// export async function saveBookmarksBatch(
//   bookmarks: {
//     raindropLink: RaindropLink;
//   }[],
//   dbPath: string = defaultBookmarkDbPath
// ): Promise<{ saved: number; skipped: number }> {
//   const db = await openDatabase(dbPath);

//   try {
//     let saved = 0;
//     let skipped = 0;

//     // Use transactions for better performance
//     await execQuery(db, "BEGIN TRANSACTION");

//     try {
//       for (const bookmark of bookmarks) {
//         try {
//           // Check if bookmark already exists
//           const existsRow = await runQuerySingle<{ count: number }>(
//             db,
//             `SELECT COUNT(*) as count FROM bookmarks WHERE raindrop_id = ?`,
//             [bookmark.raindropLink._id]
//           );

//           if ((existsRow?.count || 0) > 0) {
//             skipped++;
//             continue;
//           }

//           // Insert new bookmark
//           const raindropMetadataJson = JSON.stringify(bookmark.raindropLink);

//           await execQuery(
//             db,
//             `INSERT INTO bookmarks (raindrop_id, url, title, raindrop_metadata)
//              VALUES (?, ?, ?, ?)`,
//             [
//               bookmark.raindropLink._id,
//               bookmark.raindropLink.link,
//               bookmark.raindropLink.title,
//               raindropMetadataJson,
//             ]
//           );
//           saved++;
//         } catch (error) {
//           console.error(
//             `Error saving bookmark ${bookmark.raindropLink.link}:`,
//             error
//           );
//           // Continue with next bookmark
//         }
//       }

//       await execQuery(db, "COMMIT");
//     } catch (error) {
//       await execQuery(db, "ROLLBACK");
//       throw error;
//     }

//     return { saved, skipped };
//   } finally {
//     await closeDatabase(db);
//   }
// }

// JSON File Storage Implementation (Issue #9)
const defaultDataDir = join(process.cwd(), "data");

// Ensure data directory exists
export async function ensureDataDirectory(
  dataDir: string = defaultDataDir
): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    throw new Error(
      `Failed to create data directory: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Generate filename for bookmarks JSON with timestamp
function generateBookmarksFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  return `bookmarks-${timestamp}.json`;
}

// Save bookmarks to timestamped JSON file
export async function saveBookmarksToJson(
  bookmarks: { raindropLink: RaindropLink }[],
  dataDir: string = defaultDataDir
): Promise<{ filename: string; count: number }> {
  await ensureDataDirectory(dataDir);

  const filename = generateBookmarksFilename();
  const filepath = join(dataDir, filename);

  const data = {
    fetchedAt: new Date().toISOString(),
    count: bookmarks.length,
    bookmarks: bookmarks.map((b) => b.raindropLink),
  };

  try {
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    // console.log(`💾 Saved ${bookmarks.length} bookmarks to ${filename}`);
    return { filename, count: bookmarks.length };
  } catch (error) {
    throw new Error(
      `Failed to save bookmarks to JSON: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Get most recent update from existing JSON files
export async function getMostRecentUpdateFromJson(
  dataDir: string = defaultDataDir
): Promise<string | null> {
  try {
    await ensureDataDirectory(dataDir);

    const files = await fs.readdir(dataDir);
    const bookmarkFiles = files
      .filter((file) => file.startsWith("bookmarks-") && file.endsWith(".json"))
      .sort()
      .reverse(); // Most recent first

    if (bookmarkFiles.length === 0) {
      return null;
    }

    // Read the most recent file to get the latest lastUpdate
    const mostRecentFile = join(dataDir, bookmarkFiles[0]);
    const content = await fs.readFile(mostRecentFile, "utf-8");
    const data = JSON.parse(content);

    if (data.bookmarks && data.bookmarks.length > 0) {
      // Find the most recent lastUpdate among all bookmarks
      const lastUpdates = data.bookmarks
        .map((bookmark: RaindropLink) => bookmark.lastUpdate)
        .filter((date: string) => date)
        .sort()
        .reverse();

      return lastUpdates.length > 0 ? lastUpdates[0] : null;
    }

    return null;
  } catch (error) {
    console.warn(`Warning: Could not read existing bookmark files: ${error}`);
    return null;
  }
}

// List all bookmark JSON files
export async function listBookmarkFiles(
  dataDir: string = defaultDataDir
): Promise<string[]> {
  try {
    await ensureDataDirectory(dataDir);

    const files = await fs.readdir(dataDir);
    return files
      .filter((file) => file.startsWith("bookmarks-") && file.endsWith(".json"))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    return [];
  }
}

// Load bookmarks from a specific JSON file
export async function loadBookmarksFromJson(
  filename: string,
  dataDir: string = defaultDataDir
): Promise<RaindropLink[]> {
  const filepath = join(dataDir, filename);

  try {
    const content = await fs.readFile(filepath, "utf-8");
    const data = JSON.parse(content);
    return data.bookmarks || [];
  } catch (error) {
    throw new Error(
      `Failed to load bookmarks from ${filename}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
