import dotenv from "dotenv";
import { createAuthUrl, exchangeCodeForTokens } from "./auth/auth";
import { saveTokens } from "./storage/storage";
import { createServer } from "http";
import { URL } from "url";

dotenv.config();

const credentials = {
  clientId: process.env.RAINDROP_CLIENT_ID!,
  clientSecret: process.env.RAINDROP_CLIENT_SECRET!,
  redirectUri: process.env.RAINDROP_REDIRECT_URI!,
};

function authenticate() {
  const authUrl = createAuthUrl(credentials);

  console.log("🔐 Starting authentication server...");
  console.log("📱 Open this URL in your browser:");
  console.log(authUrl);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>❌ Error: No authorization code received</h1>");
        return;
      }

      try {
        const tokens = await exchangeCodeForTokens(credentials, code);
        await saveTokens(tokens);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <h1>✅ Authentication Successful!</h1>
          <p>You can now close this tab and run: <code>npm run fetch</code></p>
        `);

        console.log(
          "✅ Authentication complete! You can now run: npm run fetch"
        );
        server.close();
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(
          `<h1>❌ Error: ${error instanceof Error ? error.message : error}</h1>`
        );
        console.error(
          "❌ Error:",
          error instanceof Error ? error.message : error
        );
        server.close();
      }
    } else {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 Not Found</h1>");
    }
  });

  server.listen(3000, () => {
    console.log("🌐 Server running on http://localhost:3000");
    console.log("⏳ Waiting for authorization...");
  });
}

authenticate();
