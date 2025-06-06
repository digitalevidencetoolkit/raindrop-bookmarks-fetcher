import {
  initializeBookmarkDb,
  saveBookmark,
  getBookmark,
  hasBookmarkUrl,
  hasBookmarkId,
  getAllBookmarks,
  getMostRecentUpdate,
} from "../storage/storage";
import { RaindropLink } from "../types/raindrop";
import * as fs from "fs";
import * as path from "path";

const TEST_DB_PATH = path.join(__dirname, "test-bookmarks.db");

describe("Bookmark Storage Functions", () => {
  beforeEach(async () => {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    await initializeBookmarkDb(TEST_DB_PATH);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  test("should create database file on initialization", () => {
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
  });

  test("should store a bookmark", async () => {
    const raindropLink: RaindropLink = {
      _id: 123,
      title: "Example Site",
      link: "https://example.com",
      excerpt: "Test excerpt",
      note: "Test note",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["example", "test"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T00:00:00Z",
      domain: "example.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    const bookmark = {
      raindropLink,
    };

    await saveBookmark(bookmark, TEST_DB_PATH);
    const stored = await getBookmark("https://example.com", TEST_DB_PATH);

    expect(stored).toBeDefined();
    expect(stored!.url).toBe(raindropLink.link);
    expect(stored!.title).toBe(raindropLink.title);
    expect(stored!.raindrop_id).toBe(raindropLink._id);
    expect(stored!.raindrop_metadata).toEqual(raindropLink);
  });

  test("should prevent duplicate IDs", async () => {
    const raindropLink1: RaindropLink = {
      _id: 123,
      title: "Example 1",
      link: "https://example1.com",
      excerpt: "",
      note: "",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["test"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T00:00:00Z",
      domain: "example1.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };
    const raindropLink2: RaindropLink = {
      _id: 123, // Same ID
      title: "Example 2",
      link: "https://example2.com",
      excerpt: "",
      note: "",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["duplicate"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T00:00:00Z",
      domain: "example2.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    const bookmark1 = { raindropLink: raindropLink1 };
    const bookmark2 = { raindropLink: raindropLink2 };

    await saveBookmark(bookmark1, TEST_DB_PATH);
    await saveBookmark(bookmark2, TEST_DB_PATH);

    const stored = await getBookmark("https://example1.com", TEST_DB_PATH);
    expect(stored!.title).toBe("Example 1"); // First one wins
    expect(await hasBookmarkId(123, TEST_DB_PATH)).toBe(true);
  });

  test("should check if URL already exists", async () => {
    const raindropLink: RaindropLink = {
      _id: 456,
      title: "Example",
      link: "https://example.com",
      excerpt: "",
      note: "",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["test"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T00:00:00Z",
      domain: "example.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    const bookmark = { raindropLink };

    expect(await hasBookmarkUrl("https://example.com", TEST_DB_PATH)).toBe(
      false
    );
    expect(await hasBookmarkId(456, TEST_DB_PATH)).toBe(false);
    await saveBookmark(bookmark, TEST_DB_PATH);
    expect(await hasBookmarkUrl("https://example.com", TEST_DB_PATH)).toBe(
      true
    );
    expect(await hasBookmarkId(456, TEST_DB_PATH)).toBe(true);
  });

  test("should get all bookmarks", async () => {
    const raindropLink1: RaindropLink = {
      _id: 789,
      title: "Example 1",
      link: "https://example1.com",
      excerpt: "",
      note: "",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["test"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T00:00:00Z",
      domain: "example1.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };
    const raindropLink2: RaindropLink = {
      _id: 790,
      title: "Example 2",
      link: "https://example2.com",
      excerpt: "",
      note: "",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["test"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T00:00:00Z",
      domain: "example2.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    const bookmarks = [
      { raindropLink: raindropLink1 },
      { raindropLink: raindropLink2 },
    ];

    for (const bookmark of bookmarks) {
      await saveBookmark(bookmark, TEST_DB_PATH);
    }

    const all = await getAllBookmarks(TEST_DB_PATH);
    expect(all).toHaveLength(2);
    expect(all.map((b) => b.url)).toContain("https://example1.com");
    expect(all.map((b) => b.url)).toContain("https://example2.com");
    expect(all.map((b) => b.raindrop_id)).toContain(789);
    expect(all.map((b) => b.raindrop_id)).toContain(790);
  });

  test("should get most recent update date", async () => {
    // First check empty database
    expect(await getMostRecentUpdate(TEST_DB_PATH)).toBeNull();

    // Add bookmarks with different lastUpdate dates
    const raindropLink1: RaindropLink = {
      _id: 1001,
      title: "Older Link",
      link: "https://older.com",
      excerpt: "",
      note: "",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["test"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T10:00:00Z", // Older
      domain: "older.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    const raindropLink2: RaindropLink = {
      _id: 1002,
      title: "Newer Link",
      link: "https://newer.com",
      excerpt: "",
      note: "",
      type: "link",
      user: { $id: 1 },
      cover: "",
      media: [],
      tags: ["test"],
      important: false,
      removed: false,
      created: "2023-01-01T00:00:00Z",
      lastUpdate: "2023-01-01T20:00:00Z", // Newer
      domain: "newer.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    await saveBookmark({ raindropLink: raindropLink1 }, TEST_DB_PATH);
    await saveBookmark({ raindropLink: raindropLink2 }, TEST_DB_PATH);

    const mostRecent = await getMostRecentUpdate(TEST_DB_PATH);
    expect(mostRecent).toBe("2023-01-01T20:00:00Z");
  });
});
