import dotenv from "dotenv";
import { getAllLinks } from "./api/client";
import {
  loadTokens,
  saveTokens,
  initializeBookmarkDb,
  saveBookmarksBatch,
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

    console.log("🔍 Fetching all links from Raindrop.io...");

    // Initialize database
    await initializeBookmarkDb();

    const result = await getAllLinks(credentials, tokens);

    if (result.updatedTokens) {
      console.log("🔄 Refreshed auth tokens");
      await saveTokens(result.updatedTokens);
    }

    console.log(`✅ Successfully fetched ${result.links.length} links`);

    // Save bookmarks to database
    console.log("💾 Saving bookmarks to database...");

    // Convert all links to bookmark format
    const bookmarks = result.links.map((link) => ({
      raindropLink: link,
    }));

    // Process in smaller batches to avoid overwhelming the database
    const batchSize = 10;
    let totalSaved = 0;
    let totalSkipped = 0;

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          bookmarks.length / batchSize
        )} (${batch.length} items)...`
      );

      try {
        const result = await saveBookmarksBatch(batch);
        totalSaved += result.saved;
        totalSkipped += result.skipped;

        console.log(
          `  ✅ Saved ${result.saved}, skipped ${result.skipped} duplicates`
        );
      } catch (error) {
        console.error(
          `❌ Error processing batch:`,
          error instanceof Error ? error.message : error
        );
      }

      // Add a longer delay between batches
      if (i + batchSize < bookmarks.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const newCount = totalSaved;
    const skippedCount = totalSkipped;

    console.log(`✅ Added ${newCount} new bookmarks to database`);
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
