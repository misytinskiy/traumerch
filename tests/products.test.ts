import { describe, expect, it, vi } from "vitest";
import { buildNormalizedFields, fetchNormalizedProducts } from "../server/products/products";
import { CATALOG_FIELD_IDS } from "../shared/catalogFields";

const airtableMocks = vi.hoisted(() => ({
  buildAirtableListUrl: vi.fn(() => "https://example.com/airtable"),
  fetchAirtable: vi.fn(),
}));

vi.mock("../server/airtable/airtable", () => airtableMocks);

const { fetchAirtable } = airtableMocks;

describe("products normalization", () => {
  it("builds normalized fields per tier", () => {
    const fields = buildNormalizedFields(
      "sample",
      true,
      true
    );
    expect(fields).toContain(CATALOG_FIELD_IDS.nameEn);
    expect(fields).toContain(CATALOG_FIELD_IDS.sampleSales);
    expect(fields).toContain(CATALOG_FIELD_IDS.outOfStock);
    expect(fields).toContain(CATALOG_FIELD_IDS.catalogFeatured);
    expect(fields).toContain(CATALOG_FIELD_IDS.category);
  });

  it("normalizes records into product data", async () => {
    const mockResponse = new Response(
      JSON.stringify({
        records: [
          {
            id: "rec123",
            fields: {
              [CATALOG_FIELD_IDS.nameEn]: "Tee",
              [CATALOG_FIELD_IDS.nameDe]: "T-Shirt",
              [CATALOG_FIELD_IDS.sampleSales]: 6,
              [CATALOG_FIELD_IDS.outOfStock]: "1",
              [CATALOG_FIELD_IDS.category]: ["Basics", "Summer"],
              [CATALOG_FIELD_IDS.mainProductPhoto]: [
                {
                  url: "https://cdn.example.com/full.jpg",
                  thumbnails: {
                    large: { url: "https://cdn.example.com/large.jpg" },
                    small: { url: "https://cdn.example.com/small.jpg" },
                  },
                },
                {
                  url: "https://cdn.example.com/full-hover.jpg",
                  thumbnails: {
                    large: { url: "https://cdn.example.com/large-hover.jpg" },
                    small: { url: "https://cdn.example.com/small-hover.jpg" },
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
      catalogFeatured: false,
      imageUrl: "https://cdn.example.com/large.jpg",
      hoverImageUrl: "https://cdn.example.com/large-hover.jpg",
      categories: ["Basics", "Summer"],
    });
  });

  it("filters categories after normalization without Airtable formula", async () => {
    const response = new Response(
      JSON.stringify({
        records: [
          {
            id: "rec123",
            fields: {
              [CATALOG_FIELD_IDS.nameEn]: "Tee",
              [CATALOG_FIELD_IDS.category]: ["Basics"],
              [CATALOG_FIELD_IDS.mainProductPhoto]: [],
            },
          },
          {
            id: "rec456",
            fields: {
              [CATALOG_FIELD_IDS.nameEn]: "Bottle",
              [CATALOG_FIELD_IDS.category]: ["Drinkware"],
              [CATALOG_FIELD_IDS.mainProductPhoto]: [],
            },
          },
        ],
      }),
      { status: 200 }
    );

    (fetchAirtable as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response);

    const result = await fetchNormalizedProducts({
      apiToken: "token",
      priceTier: "sample",
      category: "basics",
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.categories).toEqual(["Basics"]);
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

  it("retries without catalog starring field when Airtable rejects it", async () => {
    const first = new Response("UNKNOWN_FIELD_NAME: [WEB] Catalog Starring", {
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

  it("fetches all Airtable pages when offset is present", async () => {
    const firstPage = new Response(
      JSON.stringify({
        records: [
          {
            id: "rec1",
            fields: {
              [CATALOG_FIELD_IDS.nameEn]: "Pen One",
              [CATALOG_FIELD_IDS.nameDe]: "Stift Eins",
              [CATALOG_FIELD_IDS.sales1000Plus]: "1.2",
              [CATALOG_FIELD_IDS.mainProductPhoto]: [],
            },
          },
        ],
        offset: "next-page-token",
      }),
      { status: 200 }
    );

    const secondPage = new Response(
      JSON.stringify({
        records: [
          {
            id: "rec2",
            fields: {
              [CATALOG_FIELD_IDS.nameEn]: "Wooden Pencil",
              [CATALOG_FIELD_IDS.nameDe]: "Holzbleistift",
              [CATALOG_FIELD_IDS.sales1000Plus]: "0.9",
              [CATALOG_FIELD_IDS.mainProductPhoto]: [],
            },
          },
        ],
      }),
      { status: 200 }
    );

    (fetchAirtable as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const result = await fetchNormalizedProducts({
      apiToken: "token",
      priceTier: "bulk",
    });

    expect(result.records).toHaveLength(2);
    expect(result.records[1]?.nameEn).toBe("Wooden Pencil");
  });
});
