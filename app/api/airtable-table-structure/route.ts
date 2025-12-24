import { NextRequest, NextResponse } from "next/server";

// Helper endpoint to view Airtable table structure
// Usage: GET /api/airtable-table-structure?baseId=YOUR_BASE_ID&tableName=YOUR_TABLE_NAME
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const baseId = searchParams.get("baseId");
  const tableName = searchParams.get("tableName");
  const apiToken = searchParams.get("apiToken") || process.env.API_TOKEN;

  if (!baseId || !tableName || !apiToken) {
    return NextResponse.json(
      {
        error: "Missing required parameters",
        required: ["baseId", "tableName"],
        optional: ["apiToken"],
      },
      { status: 400 }
    );
  }

  try {
    // Alternative approach: use table ID directly or fetch records to see structure
    // First, try to get records from the table to see field structure
    const tableId = searchParams.get("tableId");

    if (tableId) {
      // If tableId is provided, use it directly
      const recordsUrl = `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1`;
      const recordsResponse = await fetch(recordsUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!recordsResponse.ok) {
        const errorText = await recordsResponse.text();
        return NextResponse.json(
          {
            error: "Failed to fetch table records",
            details: errorText,
            status: recordsResponse.status,
          },
          { status: recordsResponse.status }
        );
      }

      const recordsData = await recordsResponse.json();

      // Extract field structure from records
      const fields: Record<string, any> = {};
      if (recordsData.records && recordsData.records.length > 0) {
        // Get all field names from the first record
        Object.keys(recordsData.records[0].fields).forEach((fieldName) => {
          const fieldValue = recordsData.records[0].fields[fieldName];
          fields[fieldName] = {
            name: fieldName,
            type: Array.isArray(fieldValue) ? "array" : typeof fieldValue,
            sampleValue: fieldValue,
          };
        });
      }

      return NextResponse.json({
        tableId: tableId,
        note: "Structure inferred from records (may not show all fields if record is empty)",
        fields: Object.values(fields),
        rawRecordsResponse: recordsData, // Include full response for debugging
      });
    }

    // Try meta API first (might not have permissions)
    try {
      const metadataUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
      const metadataResponse = await fetch(metadataUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        const table = metadata.tables.find(
          (t: { name: string }) => t.name === tableName
        );

        if (!table) {
          return NextResponse.json(
            {
              error: `Table "${tableName}" not found`,
              availableTables: metadata.tables.map(
                (t: { name: string }) => t.name
              ),
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          tableName: table.name,
          tableId: table.id,
          fields: table.fields.map((field: any) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            options: field.options || null,
          })),
        });
      }
    } catch (metaError) {
      // Meta API failed, will try alternative approach below
    }

    // Fallback: return error suggesting to use tableId parameter
    return NextResponse.json(
      {
        error:
          "Cannot access meta API (permissions issue). Please provide tableId parameter.",
        suggestion: "Add ?tableId=tbl6uwZdrpWZHz9DD to the URL",
        example: `/api/airtable-table-structure?baseId=${baseId}&tableName=${tableName}&tableId=tbl6uwZdrpWZHz9DD`,
      },
      { status: 403 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch table structure",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
