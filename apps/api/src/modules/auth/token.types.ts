export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPair {
  token: string;
  hash: string;
}
