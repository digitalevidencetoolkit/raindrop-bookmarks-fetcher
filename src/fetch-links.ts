import dotenv from "dotenv";
import { getAllLinks } from "./api/client";
import {
  loadTokens,
  saveTokens,
  saveBookmarksToJson,
  getMostRecentUpdateFromJson,
  loadMultiAccountConfig,
} from "./storage/storage";
import { RaindropCredentials, RaindropAccount, AuthTokens } from "./types/auth";

dotenv.config();

async function fetchLinksForAccount(
  account: RaindropAccount
): Promise<{ links: any[]; updatedTokens?: AuthTokens }> {
  const credentials: RaindropCredentials = {
    clientId: account.clientId,
    clientSecret: account.clientSecret,
    redirectUri:
      process.env.RAINDROP_REDIRECT_URI || "http://localhost:3000/callback",
  };

  const tokens: AuthTokens = {
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    expiresAt: account.expiresAt,
  };

  // Check for incremental fetch from JSON files for this account
  const lastUpdate = await getMostRecentUpdateFromJson(undefined, account.id);

  if (lastUpdate) {
    console.log(
      `🔍 [${account.id}] Fetching links updated since ${lastUpdate}...`
    );
  } else {
    console.log(`🔍 [${account.id}] Fetching all links (initial sync)...`);
  }

  const result = await getAllLinks(
    credentials,
    tokens,
    lastUpdate || undefined
  );

  if (result.updatedTokens) {
    console.log(`🔄 [${account.id}] Refreshed auth tokens`);
    // Note: In a real implementation, you'd want to update the account config
    // This would require additional logic to persist updated tokens
  }

  if (lastUpdate && result.links.length === 0) {
    console.log(`✅ [${account.id}] No new or updated links found`);
    return result;
  }

  console.log(
    `✅ [${account.id}] Successfully fetched ${result.links.length} ${
      lastUpdate ? "updated" : ""
    } links`
  );

  return result;
}

async function fetchLinks() {
  try {
    console.log("🚀 Starting bookmark fetch...");
    console.log("🔍 Environment check:");
    console.log(
      `  - RAINDROP_ACCOUNTS_JSON exists: ${!!process.env
        .RAINDROP_ACCOUNTS_JSON}`
    );
    console.log(
      `  - RAINDROP_CLIENT_ID exists: ${!!process.env.RAINDROP_CLIENT_ID}`
    );
    console.log(
      `  - tokens.json exists: ${require("fs").existsSync("tokens.json")}`
    );

    // Check for multi-account configuration first
    const multiAccountConfig = await loadMultiAccountConfig();

    if (multiAccountConfig) {
      console.log(
        `📊 Found ${multiAccountConfig.accounts.length} account(s) configured`
      );

      let totalLinks = 0;
      let totalSaved = 0;
      let totalSkipped = 0;

      // Process each account
      for (const account of multiAccountConfig.accounts) {
        console.log(`\n🔄 Processing account: ${account.id}`);

        try {
          const result = await fetchLinksForAccount(account);
          totalLinks += result.links.length;

          if (result.links.length > 0) {
            // Convert all links to bookmark format with accountId
            const bookmarks = result.links.map((link) => ({
              raindropLink: link,
              accountId: account.id,
            }));

            // Save bookmarks as individual JSON files in account subdirectory
            const saveResult = await saveBookmarksToJson(bookmarks);
            totalSaved += saveResult.saved;
            totalSkipped += saveResult.skipped;

            console.log(
              `💾 [${account.id}] Saved ${saveResult.saved} new/updated bookmarks`
            );
            if (saveResult.skipped > 0) {
              console.log(
                `⏭️  [${account.id}] Skipped ${saveResult.skipped} existing bookmarks`
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ Error fetching links for account ${account.id}:`,
            error instanceof Error ? error.message : error
          );
          // Continue with next account rather than failing entirely
        }
      }

      console.log(`\n📊 Multi-account summary:`);
      console.log(`   Total links fetched: ${totalLinks}`);
      console.log(`   Total saved: ${totalSaved}`);
      console.log(`   Total skipped: ${totalSkipped}`);

      return { links: [], totalLinks, totalSaved, totalSkipped };
    } else {
      // Fall back to single account mode
      console.log("📋 Using single account mode");

      const credentials: RaindropCredentials = {
        clientId: process.env.RAINDROP_CLIENT_ID || "",
        clientSecret: process.env.RAINDROP_CLIENT_SECRET || "",
        redirectUri:
          process.env.RAINDROP_REDIRECT_URI || "http://localhost:3000/callback",
      };

      const tokens = await loadTokens();

      if (!tokens) {
        console.error("❌ No authentication configuration found.");
        console.log("Set either:");
        console.log("  - RAINDROP_ACCOUNTS_JSON for multi-account mode");
        console.log("  - tokens.json file for single account mode");
        console.log(
          "Run 'npm run auth' to authenticate or check GitHub Secrets configuration"
        );
        process.exit(1);
      }

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

      // Save bookmarks as individual JSON files
      const saveResult = await saveBookmarksToJson(bookmarks);

      const newCount = saveResult.saved;
      const skippedCount = saveResult.skipped;

      console.log(
        `✅ Saved ${newCount} new/updated bookmarks as individual files`
      );
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
    }
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
