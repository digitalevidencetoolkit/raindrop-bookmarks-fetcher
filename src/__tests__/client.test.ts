import axios from "axios";
import { getAllLinks } from "../api/client";
import { RaindropCredentials, AuthTokens } from "../types/auth";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Client Functions", () => {
  const mockCredentials: RaindropCredentials = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    redirectUri: "http://localhost:3000/callback",
  };

  const mockTokens: AuthTokens = {
    accessToken: "valid-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.isAxiosError.mockReturnValue(true);
  });

  it("should fetch all links successfully", async () => {
    const mockLinks = [
      {
        _id: 1,
        title: "Test Link",
        link: "https://example.com",
        excerpt: "",
        note: "",
        type: "link" as const,
        user: { $id: 123 },
        cover: "",
        media: [],
        tags: ["test"],
        important: false,
        removed: false,
        created: "2023-01-01T00:00:00.000Z",
        lastUpdate: "2023-01-01T00:00:00.000Z",
        domain: "example.com",
        creatorRef: "user",
        sort: 0,
        collectionId: 0,
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({
      data: { result: true, items: mockLinks, count: 1 },
    });

    const result = await getAllLinks(mockCredentials, mockTokens);

    expect(result.links).toEqual(mockLinks);
    expect(result.links.length).toBe(1);
  });
});
