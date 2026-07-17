let accessToken: string | null;
export function setAccessToken(token: string) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function clearAccessToken() {
  accessToken = null;
}
