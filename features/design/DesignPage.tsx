import { buildAirtableRecordUrl, fetchAirtable } from "../../server/airtable/airtable";
import DesignClient from "./DesignClient";

export default async function DesignPage({
  searchParams,
}: {
  searchParams?: Promise<{ product?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const productId = resolved?.product ?? null;
  const apiToken = process.env.API_TOKEN;

  let initialRecord: { id: string; fields: Record<string, unknown> } | null =
    null;

  if (productId && apiToken) {
    try {
      const url = buildAirtableRecordUrl(productId);
      const response = await fetchAirtable(url, apiToken);
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
