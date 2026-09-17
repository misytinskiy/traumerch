import "server-only";

import { fetchWithDeadline } from "../http/fetchWithDeadline";

type AirtableLocation = {
  baseId: string;
  tableIdOrName: string;
  tablePathSegment: string;
  baseUrl: string;
  searchParams: URLSearchParams;
};

const getAirtableLocation = (): AirtableLocation => {
  const airtableLink = process.env.AIRTABLE_LINK;
  if (!airtableLink) {
    throw new Error("Missing AIRTABLE_LINK configuration");
  }

  const url = new URL(airtableLink);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 3 || parts[0] !== "v0") {
    throw new Error("AIRTABLE_LINK must be a v0 base/table URL");
  }

  const baseId = parts[1];
  const tablePathSegment = parts[2];
  const tableIdOrName = decodeURIComponent(tablePathSegment);

  return {
    baseId,
    tableIdOrName,
    tablePathSegment,
    baseUrl: `${url.origin}/v0/${baseId}/${tablePathSegment}`,
    searchParams: new URLSearchParams(url.search),
  };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AirtableFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  cache?: RequestCache;
};

export const fetchAirtable = async (
  url: string,
  apiToken: string,
  { timeoutMs = 8000, retries = 1, cache = "no-store" }: AirtableFetchOptions = {}
) => {
  let attempt = 0;

  while (attempt <= retries) {
    // Таймаут должен покрывать и чтение тела: раньше здесь наружу уходил живой
    // Response, а .json() на нём вызывался уже после снятия таймера, то есть
    // без всякого ограничения по времени.
    const { status, ok, headers, body } = await fetchWithDeadline(url, {
      timeoutMs,
      cache,
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (ok || attempt >= retries || (status !== 429 && status < 500)) {
      return status === 204 || status === 304
        ? new Response(null, { status, headers })
        : new Response(new Uint8Array(body), { status, headers });
    }

    attempt += 1;
    await delay(250 * attempt);
  }

  throw new Error("Airtable fetch failed");
};

type AirtableQueryOptions = {
  fields?: string[];
  view?: string;
  maxRecords?: number;
  pageSize?: number;
  filterByFormula?: string;
  offset?: string;
  returnFieldsByFieldId?: boolean;
};

export const buildAirtableListUrl = (options: AirtableQueryOptions = {}) => {
  const { baseUrl, searchParams } = getAirtableLocation();
  const params = new URLSearchParams(searchParams);

  if (options.view) {
    params.set("view", options.view);
  }

  if (typeof options.maxRecords === "number") {
    params.set("maxRecords", String(options.maxRecords));
  }

  if (typeof options.pageSize === "number") {
    params.set("pageSize", String(options.pageSize));
  }

  if (options.offset) {
    params.set("offset", options.offset);
  }

  if (options.fields?.length) {
    params.delete("fields[]");
    options.fields.forEach((field) => params.append("fields[]", field));
  }

  if (options.filterByFormula) {
    params.set("filterByFormula", options.filterByFormula);
  }

  if (options.returnFieldsByFieldId) {
    params.set("returnFieldsByFieldId", "true");
  }

  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
};

export const buildAirtableRecordUrl = (
  recordId: string,
  fields?: string[],
  options?: { returnFieldsByFieldId?: boolean }
) => {
  const { baseUrl, searchParams } = getAirtableLocation();
  const safeId = encodeURIComponent(recordId);
  const params = new URLSearchParams(searchParams);

  if (fields?.length) {
    params.delete("fields[]");
    fields.forEach((field) => params.append("fields[]", field));
  }

  if (options?.returnFieldsByFieldId) {
    params.set("returnFieldsByFieldId", "true");
  }

  const query = params.toString();
  return query ? `${baseUrl}/${safeId}?${query}` : `${baseUrl}/${safeId}`;
};
