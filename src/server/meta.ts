import { decrypt } from "@/lib/crypto";

const META_GRAPH_VERSION = "v19.0";
const META_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export const getOAuthUrl = (state: string) => {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    redirect_uri: process.env.META_REDIRECT_URI ?? "",
    state,
    scope: [
      "ads_read",
      "business_management",
      "read_insights",
    ].join(","),
  });

  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    client_secret: process.env.META_APP_SECRET ?? "",
    redirect_uri: process.env.META_REDIRECT_URI ?? "",
    code,
  });

  const response = await fetch(`${META_BASE}/oauth/access_token?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta token error: ${error}`);
  }
  return response.json() as Promise<{ access_token: string; expires_in: number }>;
};

export const exchangeForLongLivedToken = async (shortToken: string) => {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID ?? "",
    client_secret: process.env.META_APP_SECRET ?? "",
    fb_exchange_token: shortToken,
  });

  const response = await fetch(`${META_BASE}/oauth/access_token?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta long-lived token error: ${error}`);
  }
  return response.json() as Promise<{ access_token: string; expires_in: number }>;
};

export const fetchMetaUser = async (accessToken: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name",
  });
  const response = await fetch(`${META_BASE}/me?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta user error: ${error}`);
  }
  return response.json() as Promise<{ id: string; name: string }>;
};

export const fetchAdAccounts = async (accessToken: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,currency,timezone_name,account_status,spend_cap",
  });
  const response = await fetch(`${META_BASE}/me/adaccounts?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta ad accounts error: ${error}`);
  }
  return response.json() as Promise<{ data: Array<{
    id: string;
    name: string;
    currency: string;
    timezone_name: string;
    account_status: string;
    spend_cap?: string;
  }> }>;
};

export const fetchInsights = async (accessToken: string, adAccountId: string, since: string, until: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    time_range: JSON.stringify({ since, until }),
    fields: "spend,impressions,clicks,actions,date_start,date_stop",
    time_increment: "1",
  });
  const response = await fetch(`${META_BASE}/${adAccountId}/insights?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta insights error: ${error}`);
  }
  return response.json() as Promise<{ data: Array<{
    spend: string;
    impressions: string;
    clicks: string;
    actions?: Array<{ action_type: string; value: string }>;
    date_start: string;
    date_stop: string;
  }> }>;
};

export const getStoredAccessToken = (encryptedToken: string) => decrypt(encryptedToken);
