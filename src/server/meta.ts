import { decrypt } from "@/lib/crypto";

// Update to latest version to avoid API deprecation errors
const META_GRAPH_VERSION = "v22.0";
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

export const fetchCampaigns = async (accessToken: string, adAccountId: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,objective,status,effective_status,daily_budget,lifetime_budget,updated_time",
  });
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const response = await fetch(`${META_BASE}/${id}/campaigns?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta campaigns error: ${error}`);
  }
  return response.json() as Promise<{
    data: Array<{
      id: string;
      name: string;
      objective?: string;
      status?: string;
      effective_status?: string;
      daily_budget?: string | null;
      lifetime_budget?: string | null;
      updated_time?: string;
    }>;
  }>;
};

type InsightRow = {
  spend: string;
  impressions: string;
  clicks: string;
  actions?: Array<{ action_type: string; value: string }>;
  date_start: string;
  date_stop: string;
};

type InsightResponse = { data: Array<InsightRow>; paging?: { next?: string } };

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
  return response.json() as Promise<InsightResponse>;
};

export const fetchAllInsights = async (accessToken: string, adAccountId: string, since: string, until: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    time_range: JSON.stringify({ since, until }),
    fields: "spend,impressions,clicks,actions,date_start,date_stop",
    time_increment: "1",
  });

  let url: string | null = `${META_BASE}/${adAccountId}/insights?${params.toString()}`;
  const data: InsightRow[] = [];

  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta insights error: ${error}`);
    }
    const json = (await response.json()) as InsightResponse;
    data.push(...(json.data ?? []));
    url = json.paging?.next ?? null;
  }

  return { data };
};

export const fetchCampaignInsights = async (
  accessToken: string,
  campaignId: string,
  since: string,
  until: string,
  timeIncrement: string | null = "1",
) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    time_range: JSON.stringify({ since, until }),
    fields: "spend,impressions,clicks,actions,date_start",
  });
  if (timeIncrement) {
    params.set("time_increment", timeIncrement);
  }
  const response = await fetch(`${META_BASE}/${campaignId}/insights?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta campaign insights error: ${error}`);
  }
  return response.json() as Promise<{
    data: Array<{
      spend: string;
      impressions: string;
      clicks: string;
      actions?: Array<{ action_type: string; value: string }>;
      date_start: string;
    }>;
  }>;
};

export const fetchCampaignAdSets = async (accessToken: string, campaignId: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,daily_budget,lifetime_budget,budget_remaining,status,effective_status",
  });
  const response = await fetch(`${META_BASE}/${campaignId}/adsets?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta ad sets error: ${error}`);
  }
  return response.json() as Promise<{
    data: Array<{
      id: string;
      name: string;
      daily_budget?: string | null;
      lifetime_budget?: string | null;
      budget_remaining?: string | null;
      status?: string | null;
      effective_status?: string | null;
    }>;
  }>;
};

export const fetchCampaignDetails = async (accessToken: string, campaignId: string) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,daily_budget,lifetime_budget,budget_remaining,status,effective_status",
  });
  const response = await fetch(`${META_BASE}/${campaignId}?${params.toString()}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta campaign detail error: ${error}`);
  }
  return response.json() as Promise<{
    id: string;
    name: string;
    daily_budget?: string | null;
    lifetime_budget?: string | null;
    budget_remaining?: string | null;
    status?: string | null;
    effective_status?: string | null;
  }>;
};

export const updateCampaignStatus = async (
  accessToken: string,
  campaignId: string,
  status: "ACTIVE" | "PAUSED",
) => {
  const params = new URLSearchParams({
    access_token: accessToken,
    status,
  });
  const response = await fetch(`${META_BASE}/${campaignId}`, {
    method: "POST",
    body: params,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta update campaign error: ${error}`);
  }
  return response.json() as Promise<{ success: boolean }>;
};

export const getStoredAccessToken = (encryptedToken: string) => decrypt(encryptedToken);
