import { NextResponse } from "next/server";

const airtableLink = process.env.AIRTABLE_LINK;
const apiToken = process.env.API_TOKEN;

export async function GET() {
  if (!airtableLink || !apiToken) {
    return NextResponse.json(
      { error: "Missing Airtable configuration" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(airtableLink, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: `Airtable request failed: ${message}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Airtable data", details: `${error}` },
      { status: 500 }
    );
  }
}
