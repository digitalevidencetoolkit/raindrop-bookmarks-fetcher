import axios from "axios";
import { getValidAccessToken } from "../auth/auth";
import { RaindropLink, RaindropApiResponse } from "../types/raindrop";
import { RaindropCredentials, AuthTokens } from "../types/auth";

const baseUrl = "https://api.raindrop.io/rest/v1";

async function makeAuthenticatedRequest<T>(
  credentials: RaindropCredentials,
  tokens: AuthTokens,
  url: string
): Promise<{ data: T; updatedTokens?: AuthTokens }> {
  const tokenResult = await getValidAccessToken(credentials, tokens);

  try {
    const response = await axios.get<T>(`${baseUrl}${url}`, {
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return {
      data: response.data,
      updatedTokens: tokenResult.updatedTokens,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API request failed: ${
          error.response?.data?.errorMessage || error.message
        }`
      );
    }
    throw error;
  }
}

export async function getAllLinks(
  credentials: RaindropCredentials,
  tokens: AuthTokens
): Promise<{ links: RaindropLink[]; updatedTokens?: AuthTokens }> {
  const allLinks: RaindropLink[] = [];
  let page = 0;
  let hasMore = true;
  let currentTokens = tokens;
  let finalUpdatedTokens: AuthTokens | undefined;

  while (hasMore && page < 100) {
    const result = await makeAuthenticatedRequest<
      RaindropApiResponse<RaindropLink>
    >(
      credentials,
      currentTokens,
      `/raindrops/0?page=${page}&perpage=50&sort=-created`
    );

    if (result.updatedTokens) {
      currentTokens = result.updatedTokens;
      finalUpdatedTokens = result.updatedTokens;
    }

    allLinks.push(...result.data.items);
    hasMore = (page + 1) * 50 < result.data.count;
    page++;
  }

  return {
    links: allLinks,
    updatedTokens: finalUpdatedTokens,
  };
}
