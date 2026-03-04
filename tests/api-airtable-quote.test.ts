import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_ENV = process.env;

const makeRequest = (input: RequestInfo, init?: RequestInit) =>
  new Request(input, init);

describe("api/airtable-quote", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      API_TOKEN: "test-token",
      AIRTABLE_QUOTE_BASE_ID: "appTest",
      AIRTABLE_QUOTE_TABLE_ID: "tblTest",
    };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("returns 500 when API token is missing", async () => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
    const { POST } = await import("../app/api/airtable-quote/route");
    const request = makeRequest("http://localhost/api/airtable-quote", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.error).toContain("Missing Airtable configuration");
  });

  it("creates a record from JSON payload", async () => {
    const { POST } = await import("../app/api/airtable-quote/route");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("https://api.airtable.com/v0/");
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      expect(body.fields["Name"]).toBe("Ada");
      expect(body.fields["Preferred Type"]).toBe("WhatsApp");
      expect(body.fields["Phone"]).toBe("+123");
      return new Response(JSON.stringify({ id: "rec123" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const request = makeRequest("http://localhost/api/airtable-quote", {
      method: "POST",
      body: JSON.stringify({
        name: "Ada",
        preferredMessenger: "WhatsApp",
        messengerContact: "+123",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.recordId).toBe("rec123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects oversized attachments", async () => {
    const { POST } = await import("../app/api/airtable-quote/route");
    const bigBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append("name", "Ada");
    formData.append(
      "attachments",
      new File([bigBuffer], "big.bin", { type: "application/octet-stream" })
    );

    const request = makeRequest("http://localhost/api/airtable-quote", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(413);
    const payload = await response.json();
    expect(payload.error).toContain("Attachment too large");
  });
});
