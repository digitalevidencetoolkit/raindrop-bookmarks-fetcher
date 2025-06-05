import axios from "axios";
import { AuthTokens, RaindropCredentials, TokenResponse } from "../types/auth";

const baseUrl = "https://raindrop.io";

export function createAuthUrl(
  credentials: RaindropCredentials,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: "code",
  });

  if (state) {
    params.append("state", state);
  }

  return `${baseUrl}/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  credentials: RaindropCredentials,
  authCode: string
): Promise<AuthTokens> {
  const tokenUrl = `${baseUrl}/oauth/access_token`;

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: authCode,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: credentials.redirectUri,
  });

  try {
    const response = await axios.post<TokenResponse>(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `OAuth token exchange failed: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    throw error;
  }
}

export async function refreshAccessToken(
  credentials: RaindropCredentials,
  refreshToken: string
): Promise<AuthTokens> {
  const tokenUrl = `${baseUrl}/oauth/access_token`;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });

  try {
    const response = await axios.post<TokenResponse>(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Token refresh failed: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
}

export function isTokenExpired(tokens: AuthTokens): boolean {
  return Date.now() >= tokens.expiresAt - 5 * 60 * 1000;
}

export async function getValidAccessToken(
  credentials: RaindropCredentials,
  tokens: AuthTokens
): Promise<{ accessToken: string; updatedTokens?: AuthTokens }> {
  if (!isTokenExpired(tokens)) {
    return { accessToken: tokens.accessToken };
  }

  const updatedTokens = await refreshAccessToken(
    credentials,
    tokens.refreshToken
  );
  return {
    accessToken: updatedTokens.accessToken,
    updatedTokens,
  };
}
