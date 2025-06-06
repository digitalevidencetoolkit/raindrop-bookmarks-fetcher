import { 
  initializeBookmarkDb, 
  saveBookmark, 
  getBookmark, 
  hasBookmarkUrl, 
  getAllBookmarks 
} from '../storage/storage';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DB_PATH = path.join(__dirname, 'test-bookmarks.duckdb');

describe('Bookmark Storage Functions', () => {
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

  test('should create database file on initialization', () => {
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
  });

  test('should store a bookmark', async () => {
    const bookmark = {
      url: 'https://example.com',
      title: 'Example Site',
      tags: ['example', 'test'],
      metadata: { description: 'A test site' }
    };

    await saveBookmark(bookmark, TEST_DB_PATH);
    const stored = await getBookmark('https://example.com', TEST_DB_PATH);
    
    expect(stored).toBeDefined();
    expect(stored!.url).toBe(bookmark.url);
    expect(stored!.title).toBe(bookmark.title);
    expect(stored!.tags).toEqual(bookmark.tags);
  });

  test('should prevent duplicate URLs', async () => {
    const bookmark1 = {
      url: 'https://example.com',
      title: 'Example 1',
      tags: ['test']
    };
    const bookmark2 = {
      url: 'https://example.com',
      title: 'Example 2',
      tags: ['duplicate']
    };

    await saveBookmark(bookmark1, TEST_DB_PATH);
    await saveBookmark(bookmark2, TEST_DB_PATH);
    
    const stored = await getBookmark('https://example.com', TEST_DB_PATH);
    expect(stored!.title).toBe('Example 1'); // First one wins
  });

  test('should check if URL already exists', async () => {
    const bookmark = {
      url: 'https://example.com',
      title: 'Example',
      tags: ['test']
    };

    expect(await hasBookmarkUrl('https://example.com', TEST_DB_PATH)).toBe(false);
    await saveBookmark(bookmark, TEST_DB_PATH);
    expect(await hasBookmarkUrl('https://example.com', TEST_DB_PATH)).toBe(true);
  });

  test('should get all bookmarks', async () => {
    const bookmarks = [
      { url: 'https://example1.com', title: 'Example 1', tags: ['test'] },
      { url: 'https://example2.com', title: 'Example 2', tags: ['test'] }
    ];

    for (const bookmark of bookmarks) {
      await saveBookmark(bookmark, TEST_DB_PATH);
    }

    const all = await getAllBookmarks(TEST_DB_PATH);
    expect(all).toHaveLength(2);
    expect(all.map(b => b.url)).toContain('https://example1.com');
    expect(all.map(b => b.url)).toContain('https://example2.com');
  });
});