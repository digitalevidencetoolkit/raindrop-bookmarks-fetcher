import {
  saveBookmarksToJson,
  getMostRecentUpdateFromJson,
} from "../storage/storage";
import { RaindropLink } from "../types/raindrop";
import * as fs from "fs";
import * as path from "path";

const TEST_DATA_DIR = path.join(__dirname, "test-data");

describe("JSON Storage Functions", () => {
  afterEach(() => {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  test("should save bookmarks to JSON file", async () => {
    const bookmark: RaindropLink = {
      _id: 123,
      title: "Test Site",
      link: "https://test.com",
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
      lastUpdate: "2023-01-01T10:00:00Z",
      domain: "test.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    const result = await saveBookmarksToJson(
      [{ raindropLink: bookmark }],
      TEST_DATA_DIR
    );

    expect(result.count).toBe(1);
    expect(result.filename).toMatch(/^bookmarks-.*\.json$/);
    expect(fs.existsSync(path.join(TEST_DATA_DIR, result.filename))).toBe(true);
  });

  test("should get most recent update date", async () => {
    const oldBookmark: RaindropLink = {
      _id: 123,
      title: "Test Site 2",
      link: "https://test2.com",
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
      lastUpdate: "2023-01-01T15:00:00Z",
      domain: "test2.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };
    const newBookmark: RaindropLink = {
      _id: 456,
      title: "Test Site 2",
      link: "https://test2.com",
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
      lastUpdate: "2025-01-01T15:00:00Z",
      domain: "test2.com",
      creatorRef: "test",
      sort: 0,
      collectionId: 1,
    };

    await saveBookmarksToJson([{ raindropLink: oldBookmark }], TEST_DATA_DIR);
    await saveBookmarksToJson([{ raindropLink: newBookmark }], TEST_DATA_DIR);

    const mostRecent = await getMostRecentUpdateFromJson(TEST_DATA_DIR);
    expect(mostRecent).toBe("2025-01-01T15:00:00Z");
  });

  test("should return null when no files exist", async () => {
    const result = await getMostRecentUpdateFromJson(TEST_DATA_DIR);
    expect(result).toBeNull();
  });
});
