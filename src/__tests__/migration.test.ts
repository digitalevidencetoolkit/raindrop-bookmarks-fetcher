import { initializeBookmarkDb } from "../storage/storage";
import * as sqlite3 from "sqlite3";
import * as fs from "fs";
import * as path from "path";

const TEST_MIGRATION_DB_PATH = path.join(__dirname, "test-migration.db");

// Helper to open database connection
function openDatabase(dbPath: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

// Helper to close database connection
function closeDatabase(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Helper to execute queries
function execQuery(
  db: sqlite3.Database,
  query: string,
  params: any[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err: Error | null) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Helper to run queries
function runQuery<T = any>(
  db: sqlite3.Database,
  query: string,
  params: any[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

describe("Database Migration", () => {
  beforeEach(() => {
    // Clean up test database
    if (fs.existsSync(TEST_MIGRATION_DB_PATH)) {
      fs.unlinkSync(TEST_MIGRATION_DB_PATH);
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_MIGRATION_DB_PATH)) {
      fs.unlinkSync(TEST_MIGRATION_DB_PATH);
    }
  });

  test("should create new database with correct schema", async () => {
    await initializeBookmarkDb(TEST_MIGRATION_DB_PATH);

    const db = await openDatabase(TEST_MIGRATION_DB_PATH);
    try {
      const schema = await runQuery(db, `PRAGMA table_info(bookmarks)`);

      const columnNames = schema.map((col: any) => col.name);
      expect(columnNames).toContain("raindrop_id");
      expect(columnNames).toContain("url");
      expect(columnNames).toContain("title");
      expect(columnNames).toContain("raindrop_metadata");

      // Should not contain old columns
      expect(columnNames).not.toContain("tags");
      expect(columnNames).not.toContain("metadata");
      expect(columnNames).not.toContain("fetched_at");
    } finally {
      await closeDatabase(db);
    }
  });

  test("should migrate database with old schema", async () => {
    // Create database with old schema
    const db = await openDatabase(TEST_MIGRATION_DB_PATH);

    try {
      // Create old schema
      await execQuery(
        db,
        `
        CREATE TABLE bookmarks (
          url TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          tags TEXT,
          metadata TEXT,
          fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
      );

      // Insert some old data
      await execQuery(
        db,
        `INSERT INTO bookmarks (url, title, tags, metadata) VALUES (?, ?, ?, ?)`,
        ["https://old-example.com", "Old Example", '["old"]', '{"old": true}']
      );
    } finally {
      await closeDatabase(db);
    }

    // Run migration
    await initializeBookmarkDb(TEST_MIGRATION_DB_PATH);

    // Verify new schema
    const migratedDb = await openDatabase(TEST_MIGRATION_DB_PATH);
    try {
      const schema = await runQuery(migratedDb, `PRAGMA table_info(bookmarks)`);

      const columnNames = schema.map((col: any) => col.name);
      expect(columnNames).toContain("raindrop_id");
      expect(columnNames).toContain("url");
      expect(columnNames).toContain("title");
      expect(columnNames).toContain("raindrop_metadata");

      // Should not contain old columns
      expect(columnNames).not.toContain("tags");
      expect(columnNames).not.toContain("metadata");
      expect(columnNames).not.toContain("fetched_at");

      // Old data should be gone (as expected since it lacks raindrop_metadata)
      const rows = await runQuery(
        migratedDb,
        `SELECT COUNT(*) as count FROM bookmarks`
      );
      expect(rows[0].count).toBe(0);
    } finally {
      await closeDatabase(migratedDb);
    }
  });
});
