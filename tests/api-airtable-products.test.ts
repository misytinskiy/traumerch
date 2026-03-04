import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../server/products/products", () => ({
  fetchNormalizedProducts: vi.fn(),
}));

vi.mock("../server/airtable/airtable", () => ({
  buildAirtableListUrl: vi.fn(() => "https://example.com/airtable"),
  buildAirtableRecordUrl: vi.fn(() => "https://example.com/airtable/rec"),
  fetchAirtable: vi.fn(),
}));

const ORIGINAL_ENV = process.env;

describe("api/airtable-products", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, API_TOKEN: "test-token" };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("returns normalized data by default", async () => {
    const { GET } = await import("../app/api/airtable-products/route");
    const { fetchNormalizedProducts } = await import("../server/products/products");
    (fetchNormalizedProducts as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      records: [{ id: "rec1" }],
      offset: undefined,
    });

    const request = new Request("http://localhost/api/airtable-products");
    const response = await GET(request as never);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.records).toHaveLength(1);
  });

  it("returns 304 when ETag matches", async () => {
    const { GET } = await import("../app/api/airtable-products/route");
    const { fetchNormalizedProducts } = await import("../server/products/products");
    (fetchNormalizedProducts as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        records: [{ id: "rec1" }],
        offset: undefined,
      })
      .mockResolvedValueOnce({
        records: [{ id: "rec1" }],
        offset: undefined,
      });

    const request1 = new Request("http://localhost/api/airtable-products");
    const response1 = await GET(request1 as never);
    const etag = response1.headers.get("etag");

    const request2 = new Request("http://localhost/api/airtable-products", {
      headers: { "if-none-match": etag || "" },
    });
    const response2 = await GET(request2 as never);
    expect(response2.status).toBe(304);
  });

  it("fetches raw Airtable record when recordId is provided", async () => {
    const { GET } = await import("../app/api/airtable-products/route");
    const { fetchAirtable } = await import("../server/airtable/airtable");
    (fetchAirtable as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "rec123" }), { status: 200 })
    );

    const request = new Request(
      "http://localhost/api/airtable-products?recordId=rec123"
    );
    const response = await GET(request as never);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.id).toBe("rec123");
  });
});
