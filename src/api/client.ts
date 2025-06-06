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
  tokens: AuthTokens,
  sinceDate?: string
): Promise<{ links: RaindropLink[]; updatedTokens?: AuthTokens }> {
  const allLinks: RaindropLink[] = [];
  let page = 0;
  let hasMore = true;
  let currentTokens = tokens;
  let finalUpdatedTokens: AuthTokens | undefined;

  while (hasMore && page < 100) {
    // Sort by created date to get most recently created items first
    // This helps with incremental fetching
    let url = `/raindrops/0?page=${page}&perpage=50&sort=-created`;
    
    const result = await makeAuthenticatedRequest<
      RaindropApiResponse<RaindropLink>
    >(credentials, currentTokens, url);

    if (result.updatedTokens) {
      currentTokens = result.updatedTokens;
      finalUpdatedTokens = result.updatedTokens;
    }

    const newLinks = result.data.items;
    
    // If we have a sinceDate, filter out links that haven't been updated since then
    if (sinceDate) {
      const filteredLinks = newLinks.filter(link => 
        new Date(link.lastUpdate) > new Date(sinceDate)
      );
      
      // If we got fewer filtered links than requested, we've reached the cutoff
      if (filteredLinks.length < newLinks.length) {
        allLinks.push(...filteredLinks);
        break;
      }
      
      allLinks.push(...filteredLinks);
    } else {
      allLinks.push(...newLinks);
    }

    hasMore = (page + 1) * 50 < result.data.count;
    page++;
  }

  return {
    links: allLinks,
    updatedTokens: finalUpdatedTokens,
  };
}
