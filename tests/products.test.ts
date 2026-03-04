import { describe, expect, it, vi } from "vitest";
import { buildNormalizedFields, fetchNormalizedProducts } from "../server/products/products";

const airtableMocks = vi.hoisted(() => ({
  buildAirtableListUrl: vi.fn(() => "https://example.com/airtable"),
  fetchAirtable: vi.fn(),
}));

vi.mock("../server/airtable/airtable", () => airtableMocks);

const { fetchAirtable } = airtableMocks;

describe("products normalization", () => {
  it("builds normalized fields per tier", () => {
    const fields = buildNormalizedFields("sample", true);
    expect(fields).toContain("[WEB] Name ENG");
    expect(fields).toContain("1-24 pcs (Sample) | SALES");
    expect(fields).toContain("Out of Stock");
  });

  it("normalizes records into product data", async () => {
    const mockResponse = new Response(
      JSON.stringify({
        records: [
          {
            id: "rec123",
            fields: {
              "[WEB] Name ENG": "Tee",
              "[WEB] Name DE": "T-Shirt",
              "1-24 pcs (Sample) | SALES": 6,
              "Out of Stock": "1",
              "Item Category": ["Basics", "Summer"],
              "Main Product Photo": [
                {
                  url: "https://cdn.example.com/full.jpg",
                  thumbnails: {
                    large: { url: "https://cdn.example.com/large.jpg" },
                    small: { url: "https://cdn.example.com/small.jpg" },
                  },
                },
              ],
            },
          },
        ],
      }),
      { status: 200 }
    );

    (fetchAirtable as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse
    );

    const result = await fetchNormalizedProducts({
      apiToken: "token",
      priceTier: "sample",
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      id: "rec123",
      nameEn: "Tee",
      nameDe: "T-Shirt",
      price: "From €6",
      outOfStock: true,
      imageUrl: "https://cdn.example.com/large.jpg",
      categories: ["Basics", "Summer"],
    });
  });

  it("retries without out-of-stock field when Airtable rejects it", async () => {
    const first = new Response("UNKNOWN_FIELD_NAME: Out of Stock", {
      status: 422,
    });
    const second = new Response(
      JSON.stringify({ records: [], offset: undefined }),
      { status: 200 }
    );

    (fetchAirtable as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    const result = await fetchNormalizedProducts({
      apiToken: "token",
      priceTier: "sample",
    });

    expect(result.records).toEqual([]);
  });
});
