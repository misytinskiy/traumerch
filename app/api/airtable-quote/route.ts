import { NextRequest, NextResponse } from "next/server";

const BASE_ID = "appXSC0IhX502fj8d";
const TABLE_ID = "tbl6uwZdrpWZHz9DD";
const apiToken = process.env.API_TOKEN;

export async function POST(request: NextRequest) {
  if (!apiToken) {
    return NextResponse.json(
      { error: "Missing API_TOKEN configuration" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log("=== AIRTABLE QUOTE API - REQUEST BODY ===");
    console.log("Full body:", JSON.stringify(body, null, 2));
    
    const {
      name,
      email,
      preferredMessenger,
      messengerContact,
      requestType,
      service,
      description,
    } = body;

    console.log("=== EXTRACTED VALUES ===");
    console.log("name:", name);
    console.log("email:", email);
    console.log("preferredMessenger:", preferredMessenger, "(type:", typeof preferredMessenger, ")");
    console.log("messengerContact:", messengerContact);
    console.log("requestType:", requestType);
    console.log("service:", service);
    console.log("description:", description);

    // Map form data to Airtable fields based on actual table structure
    // Fields: Name, Email, Phone, Preferred Type, Username, Description, Request Type, Attachments
    const airtableFields: Record<string, string> = {};
    
    // Basic text fields
    if (name) airtableFields["Name"] = name;
    if (email) airtableFields["Email"] = email;
    if (description) airtableFields["Description"] = description;

    // Services - single select (exact Airtable option names required)
    if (service) {
      const servicesMap: Record<string, string> = {
        "Private Label": "Private label",
        "Influancer Activation": "Influancer Activation",
        "Smart Platform": "Smart Platform",
      };
      const airtableService = servicesMap[service] ?? service;
      airtableFields["Services"] = airtableService;
      console.log("✅ Set Services to:", airtableService);
    }
    
    // Request Type - capitalize first letter (Merchandise or Services)
    if (requestType) {
      airtableFields["Request Type"] =
        requestType.charAt(0).toUpperCase() + requestType.slice(1);
    }
    
    // Preferred Type (Messenger) - map our messenger names to Airtable select options
    // Airtable options: Email, WhatsApp, Slack, Teams
    console.log("=== PREFERRED MESSENGER MAPPING ===");
    console.log("preferredMessenger value:", preferredMessenger);
    console.log("preferredMessenger type:", typeof preferredMessenger);
    console.log("preferredMessenger truthy?", !!preferredMessenger);
    
    if (preferredMessenger) {
      // Map form messenger names to Airtable select options (exact match required)
      const messengerMap: Record<string, string | null> = {
        WhatsApp: "WhatsApp",
        Email: "Email",
        Teams: "Teams",
        // Facebook is not in Airtable options, skip it or use Email as fallback
        Facebook: null, // Skip Facebook as it's not available in Airtable
      };
      
      console.log("messengerMap:", messengerMap);
      console.log("Looking for key:", preferredMessenger);
      console.log("Key exists in map?", preferredMessenger in messengerMap);
      
      const mappedMessenger = messengerMap[preferredMessenger];
      console.log("mappedMessenger result:", mappedMessenger);
      
      if (mappedMessenger) {
        airtableFields["Preferred Type"] = mappedMessenger;
        console.log("✅ Set Preferred Type to:", mappedMessenger);
      } else {
        console.log("❌ No mapping found for:", preferredMessenger);
        console.log("Available keys in map:", Object.keys(messengerMap));
      }
    } else {
      console.log("❌ preferredMessenger is empty/falsy");
    }
    
    // Username or Phone - depends on messenger type
    // Airtable has: Phone (for WhatsApp) and Username (for others)
    console.log("=== MESSENGER CONTACT MAPPING ===");
    console.log("messengerContact:", messengerContact);
    console.log("preferredMessenger for contact:", preferredMessenger);
    
    if (messengerContact) {
      const messengerName = preferredMessenger?.toLowerCase() || "";
      console.log("messengerName (lowercase):", messengerName);
      
      if (messengerName === "whatsapp") {
        // For WhatsApp, use Phone field
        airtableFields["Phone"] = messengerContact;
        console.log("✅ Set Phone to:", messengerContact);
      } else if (messengerName === "email") {
        // Email is already in Email field, skip contact info
        console.log("ℹ️ Email selected - contact info not needed");
      } else if (messengerName === "teams" || messengerName === "facebook") {
        // For Teams, Facebook, etc., use Username field
        airtableFields["Username"] = messengerContact;
        console.log("✅ Set Username to:", messengerContact);
      } else {
        console.log("⚠️ Unknown messenger type for contact:", messengerName);
      }
    } else {
      console.log("ℹ️ No messengerContact provided");
    }
    
    console.log("=== FINAL AIRTABLE FIELDS ===");
    console.log("Sending to Airtable:", JSON.stringify(airtableFields, null, 2));

    // Create record in Airtable
    const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
    const response = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: airtableFields,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Airtable API error:", errorText);
      return NextResponse.json(
        {
          error: "Failed to create record in Airtable",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      recordId: data.id,
      data: data,
    });
  } catch (error) {
    console.error("Error submitting quote:", error);
    return NextResponse.json(
      {
        error: "Failed to submit quote",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

