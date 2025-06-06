import axios from "axios";
import {
  createAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  isTokenExpired,
  getValidAccessToken,
} from "../auth/auth";
import { RaindropCredentials, AuthTokens } from "../types/auth";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Auth Functions", () => {
  const mockCredentials: RaindropCredentials = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    redirectUri: "http://localhost:3000/callback",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate auth URL correctly", () => {
    const authUrl = createAuthUrl(mockCredentials, "test-state");
    expect(authUrl).toContain("https://raindrop.io/oauth/authorize");
    expect(authUrl).toContain("client_id=test-client-id");
    expect(authUrl).toContain("state=test-state");
  });

  it("should exchange auth code for tokens", async () => {
    const mockResponse = {
      data: {
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await exchangeCodeForTokens(mockCredentials, "auth-code");

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.expiresAt).toBeGreaterThan(Date.now());
  });

  it("should refresh expired tokens", async () => {
    const mockResponse = {
      data: {
        access_token: "new-token",
        refresh_token: "new-refresh",
        expires_in: 3600,
        token_type: "Bearer",
      },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const result = await refreshAccessToken(mockCredentials, "refresh-token");
    expect(result.accessToken).toBe("new-token");
  });

  it("should detect token expiration correctly", () => {
    const expiredTokens: AuthTokens = {
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() - 1000,
    };

    expect(isTokenExpired(expiredTokens)).toBe(true);

    const validTokens: AuthTokens = {
      accessToken: "token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    expect(isTokenExpired(validTokens)).toBe(false);
  });

  it("should return valid token when not expired", async () => {
    const validTokens: AuthTokens = {
      accessToken: "valid-token",
      refreshToken: "refresh",
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    const result = await getValidAccessToken(mockCredentials, validTokens);
    expect(result.accessToken).toBe("valid-token");
    expect(result.updatedTokens).toBeUndefined();
  });
});
