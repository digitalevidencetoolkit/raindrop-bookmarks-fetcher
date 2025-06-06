import { promises as fs } from "fs";
import { join } from "path";
import { AuthTokens } from "../types/auth";

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
