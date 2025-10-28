export interface RaindropCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthConfig {
  credentials: RaindropCredentials;
  tokens?: AuthTokens;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface RaindropAccount {
  id: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface MultiAccountConfig {
  accounts: RaindropAccount[];
}
