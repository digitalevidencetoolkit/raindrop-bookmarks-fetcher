import dotenv from "dotenv";
import { getAllLinks } from "./api/client";
import { loadTokens, saveTokens } from "./storage/storage";
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

    const result = await getAllLinks(credentials, tokens);

    if (result.updatedTokens) {
      console.log("🔄 Refreshed auth tokens");
      await saveTokens(result.updatedTokens);
    }

    console.log(`✅ Successfully fetched ${result.links.length} links`);

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

    // @TODO Where to store?
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
