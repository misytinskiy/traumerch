import { buildAirtableRecordUrl, fetchAirtable } from "../../lib/airtable";
import DesignClient from "./DesignClient";

export const revalidate = 300;

type SearchParams =
  | { product?: string }
  | Promise<{ product?: string }>;

export default async function Design({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const productId = resolved?.product ?? null;
  const apiToken = process.env.API_TOKEN;

  let initialRecord: { id: string; fields: Record<string, unknown> } | null =
    null;

  if (productId && apiToken) {
    try {
      const url = buildAirtableRecordUrl(productId);
      const response = await fetchAirtable(url, apiToken, {
        revalidateSeconds: 300,
      });
      if (response.ok) {
        initialRecord = (await response.json()) as {
          id: string;
          fields: Record<string, unknown>;
        };
      }
    } catch {
      initialRecord = null;
    }
  }

  return (
    <DesignClient
      productId={productId}
      initialRecord={initialRecord}
    />
  );
}
