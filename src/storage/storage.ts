import { promises as fs } from "fs";
import { join } from "path";
import { AuthTokens } from "../types/auth";
import { Database } from "duckdb";

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
  url: string;
  title: string;
  tags: string[];
  metadata?: Record<string, any>;
  fetched_at: string;
}

const defaultBookmarkDbPath = join(process.cwd(), "bookmarks.duckdb");

// Helper function to promisify DuckDB operations
function runQuery<T = any>(
  db: Database,
  query: string
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(query, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

function runQuerySingle<T = any>(
  db: Database,
  query: string
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    db.all(query, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve((rows.length > 0 ? rows[0] as T : null));
    });
  });
}

function execQuery(
  db: Database,
  query: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(query, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Helper to escape SQL strings safely
function escapeSqlString(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export async function initializeBookmarkDb(
  dbPath: string = defaultBookmarkDbPath
): Promise<void> {
  const db = new Database(dbPath);

  try {
    await execQuery(
      db,
      `
      CREATE TABLE IF NOT EXISTS bookmarks (
        url TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        tags JSON,
        metadata JSON,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    );
  } finally {
    db.close();
  }
}

export async function saveBookmark(
  bookmark: {
    url: string;
    title: string;
    tags?: string[];
    metadata?: Record<string, any>;
  },
  dbPath: string = defaultBookmarkDbPath
): Promise<void> {
  const db = new Database(dbPath);

  try {
    const tagsJson = escapeSqlString(JSON.stringify(bookmark.tags || []));
    const metadataJson = escapeSqlString(JSON.stringify(bookmark.metadata || {}));
    const url = escapeSqlString(bookmark.url);
    const title = escapeSqlString(bookmark.title);
    
    await execQuery(
      db,
      `INSERT OR IGNORE INTO bookmarks (url, title, tags, metadata)
       VALUES (${url}, ${title}, ${tagsJson}, ${metadataJson})`
    );
  } finally {
    db.close();
  }
}

export async function getBookmark(
  url: string,
  dbPath: string = defaultBookmarkDbPath
): Promise<StoredBookmark | null> {
  const db = new Database(dbPath);

  try {
    const escapedUrl = escapeSqlString(url);
    const row = await runQuerySingle<{
      url: string;
      title: string;
      tags: string;
      metadata: string;
      fetched_at: string;
    }>(
      db,
      `SELECT url, title, tags, metadata, fetched_at
       FROM bookmarks
       WHERE url = ${escapedUrl}`
    );

    if (!row) return null;

    return {
      url: row.url,
      title: row.title,
      tags: JSON.parse(row.tags),
      metadata: JSON.parse(row.metadata),
      fetched_at: row.fetched_at,
    };
  } finally {
    db.close();
  }
}

export async function hasBookmarkUrl(
  url: string,
  dbPath: string = defaultBookmarkDbPath
): Promise<boolean> {
  const db = new Database(dbPath);

  try {
    const escapedUrl = escapeSqlString(url);
    const row = await runQuerySingle<{ count: number }>(
      db,
      `SELECT COUNT(*) as count
       FROM bookmarks
       WHERE url = ${escapedUrl}`
    );

    return (row?.count || 0) > 0;
  } finally {
    db.close();
  }
}

export async function getAllBookmarks(
  dbPath: string = defaultBookmarkDbPath
): Promise<StoredBookmark[]> {
  const db = new Database(dbPath);

  try {
    const rows = await runQuery<{
      url: string;
      title: string;
      tags: string;
      metadata: string;
      fetched_at: string;
    }>(
      db,
      `SELECT url, title, tags, metadata, fetched_at
       FROM bookmarks
       ORDER BY fetched_at DESC`
    );

    return rows.map((row) => ({
      url: row.url,
      title: row.title,
      tags: JSON.parse(row.tags),
      metadata: JSON.parse(row.metadata),
      fetched_at: row.fetched_at,
    }));
  } finally {
    db.close();
  }
}
