import dotenv from "dotenv";
import { getAllLinks } from "./api/client";
import {
  loadTokens,
  saveTokens,
  saveBookmarksToJson,
  getMostRecentUpdateFromJson,
} from "./storage/storage";
import { RaindropCredentials } from "./types/auth";

dotenv.config();

async function fetchLinks() {
  try {
    const credentials: RaindropCredentials = {
      clientId: process.env.RAINDROP_CLIENT_ID || "",
      clientSecret: process.env.RAINDROP_CLIENT_SECRET || "",
      redirectUri:
        process.env.RAINDROP_REDIRECT_URI || "http://localhost:3000/callback",
    };

    const tokens = await loadTokens();

    if (!tokens) {
      console.error(
        "❌ No authentication tokens found. Please authenticate first."
      );
      console.log("Run the auth flow manually or set up tokens in tokens.json");
      process.exit(1);
    }

    // JSON files will be created automatically when needed

    // Check for incremental fetch from JSON files
    const lastUpdate = await getMostRecentUpdateFromJson();

    if (lastUpdate) {
      console.log(`🔍 Fetching links updated since ${lastUpdate}...`);
    } else {
      console.log("🔍 Fetching all links from Raindrop.io (initial sync)...");
    }

    const result = await getAllLinks(
      credentials,
      tokens,
      lastUpdate || undefined
    );

    if (result.updatedTokens) {
      console.log("🔄 Refreshed auth tokens");
      await saveTokens(result.updatedTokens);
    }

    if (lastUpdate && result.links.length === 0) {
      console.log("✅ No new or updated links found");
      return result;
    }

    console.log(
      `✅ Successfully fetched ${result.links.length} ${
        lastUpdate ? "updated" : ""
      } links`
    );

    // Save bookmarks to JSON files
    console.log("💾 Saving bookmarks to JSON files...");

    // Convert all links to bookmark format
    const bookmarks = result.links.map((link) => ({
      raindropLink: link,
    }));

    // Save all bookmarks to a new timestamped JSON file
    const saveResult = await saveBookmarksToJson(bookmarks);

    const newCount = saveResult.count;
    const skippedCount = 0; // In JSON approach, we save all fetched bookmarks to new files

    console.log(`✅ Added ${newCount} new bookmarks to ${saveResult.filename}`);
    if (skippedCount > 0) {
      console.log(`⏭️  Skipped ${skippedCount} existing bookmarks`);
    }

    // Show some sample links
    if (result.links.length > 0) {
      console.log("\n📄 Sample links:");
      result.links.slice(0, 5).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.title || "Untitled"} - ${link.link}`);
      });

      if (result.links.length > 5) {
        console.log(`  ... and ${result.links.length - 5} more`);
      }
    }

    return result;
  } catch (error) {
    console.error(
      "❌ Error fetching links:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

if (require.main === module) {
  fetchLinks();
}

export { fetchLinks };
