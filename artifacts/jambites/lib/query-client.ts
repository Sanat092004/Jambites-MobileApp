import { setBaseUrl } from "@workspace/api-client-react";

let baseUrl = "";

export function initializeBaseUrl() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    baseUrl = `https://${domain}/`;
    setBaseUrl(baseUrl);
  }
}

export function getApiUrl(): string {
  return baseUrl;
}
