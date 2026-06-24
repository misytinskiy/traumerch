import { NextRequest, NextResponse } from "next/server";

const BASE_ID = process.env.QUOTE_BASE_ID;
const TABLE_ID = process.env.QUOTE_TABLE_ID;
const apiToken = process.env.API_TOKEN;
const LEAD_SOURCE_FIELD = "Lead Source";
const WEBSITE_LEAD_SOURCE_VALUE = "Website";

// /conf override — server-side whitelist. We do NOT trust an arbitrary "source"
// label from the client. The override only triggers when the client sends the
// exact (sourceKey, campaign) pair below, in which case we use the hard-coded
// Lead Source value. Anything else falls back to the regular Website value.
const CONF_SOURCE_KEY = "conf_qr";
const CONF_CAMPAIGN = "ggate26";
const CONF_LEAD_SOURCE_VALUE = "GGATE26 QR / CBDO Back";
const CONF_LANDING_PAGE = "/conf";

// Optional extra fields written only when the /conf override matches. They are
// declared here so we can selectively drop them if Airtable's schema rejects
// any of them with UNKNOWN_FIELD_NAME.
const CONF_OPTIONAL_FIELDS = [
  "Source Key",
  "Campaign",
  "Landing Page",
  "Scan ID",
  "Visitor ID",
] as const;

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs = 10000
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export async function POST(request: NextRequest) {
  if (!apiToken) {
    return NextResponse.json(
      { error: "Missing API_TOKEN configuration" },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};
    let attachments: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const entries = Array.from(formData.entries());
      body = entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value instanceof File) return acc;
        acc[key] = value;
        return acc;
      }, {});
      attachments = formData
        .getAll("attachments")
        .filter((value): value is File => value instanceof File && value.size > 0);
    } else {
      body = await request.json();
    }

    const {
      name,
      surname,
      email,
      phone,
      companyName,
      address,
      apartment,
      postalCode,
      city,
      country,
      vatNumber,
      preferredDeliveryDate,
      productQuantity,
      preferredMessenger,
      messengerContact,
      requestType,
      service,
      description,
      // /conf override fields — see CONF_* constants at the top of the file.
      sourceKey,
      campaign,
      landingPage,
      scanId,
      visitorId,
    } = body;

    const toStringField = (value: unknown) =>
      typeof value === "string" ? value : value == null ? "" : String(value);

    // Map form data to Airtable fields based on actual table structure
    // Fields: Name, Surname, Email, Phone, Company name, Address, Apartment, Postal code, City, Country, Vat number, Preferred delivery date, Product quantity
    // Also supports: Preferred Type, Username, Description, Request Type, Services (from QuoteOverlay)
    const airtableFields: Record<
      string,
      | string
      | number
      | boolean
      | string[]
      | Array<{ url: string; filename?: string }>
    > = {};

    // Default: every submission to this endpoint is a regular website lead.
    // The /conf landing page sends sourceKey + campaign so the server can
    // safely opt-in to the conf override below.
    const isConfSubmission =
      toStringField(sourceKey).toLowerCase() === CONF_SOURCE_KEY &&
      toStringField(campaign).toLowerCase() === CONF_CAMPAIGN;

    airtableFields[LEAD_SOURCE_FIELD] = isConfSubmission
      ? CONF_LEAD_SOURCE_VALUE
      : WEBSITE_LEAD_SOURCE_VALUE;

    if (isConfSubmission) {
      airtableFields["Source Key"] = CONF_SOURCE_KEY;
      airtableFields["Campaign"] = CONF_CAMPAIGN;
      const landingPageStr = toStringField(landingPage);
      airtableFields["Landing Page"] = landingPageStr || CONF_LANDING_PAGE;
      const scanIdStr = toStringField(scanId);
      if (scanIdStr) airtableFields["Scan ID"] = scanIdStr;
      const visitorIdStr = toStringField(visitorId);
      if (visitorIdStr) airtableFields["Visitor ID"] = visitorIdStr;
    }

    
    // Contact form fields (from contact page)
    const nameStr = toStringField(name);
    if (nameStr) airtableFields["Name"] = nameStr;
    const surnameStr = toStringField(surname);
    if (surnameStr) airtableFields["Surname"] = surnameStr;
    const emailStr = toStringField(email);
    if (emailStr) airtableFields["Email"] = emailStr;
    const phoneStr = toStringField(phone);
    if (phoneStr) airtableFields["Phone"] = phoneStr;
    const companyNameStr = toStringField(companyName);
    if (companyNameStr) airtableFields["Company name"] = companyNameStr;
    const addressStr = toStringField(address);
    if (addressStr) airtableFields["Address"] = addressStr;
    const apartmentStr = toStringField(apartment);
    if (apartmentStr) airtableFields["Apartment"] = apartmentStr;
    const postalCodeStr = toStringField(postalCode);
    if (postalCodeStr) airtableFields["Postal code"] = postalCodeStr;
    const cityStr = toStringField(city);
    if (cityStr) airtableFields["City"] = cityStr;
    const countryStr = toStringField(country);
    if (countryStr) airtableFields["Country"] = countryStr;
    const vatNumberStr = toStringField(vatNumber);
    if (vatNumberStr) airtableFields["Vat number"] = vatNumberStr;
    const preferredDeliveryDateStr = toStringField(preferredDeliveryDate);
    if (preferredDeliveryDateStr) {
      airtableFields["Preferred delivery date"] = preferredDeliveryDateStr;
    }
    if (productQuantity !== undefined && productQuantity !== null) {
      const qtyNum = typeof productQuantity === 'string' 
        ? parseInt(productQuantity, 10) 
        : Math.floor(Number(productQuantity));

      if (!Number.isNaN(qtyNum) && qtyNum > 0 && Number.isInteger(qtyNum)) {
        const qtyStr = String(qtyNum);
        airtableFields["Product quantity"] = qtyStr;
      }
    }
    
    // QuoteOverlay form fields (legacy support)
    const descriptionStr = toStringField(description);
    if (descriptionStr) airtableFields["Description"] = descriptionStr;

    const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
    if (attachments.length > 0) {
      const tooLarge = attachments.find((file) => file.size > MAX_ATTACHMENT_BYTES);
      if (tooLarge) {
        return NextResponse.json(
          {
            error: "Attachment too large",
            details: `${tooLarge.name} exceeds 5MB upload limit for direct attachment API`,
          },
          { status: 413 }
        );
      }
    }

    let normalizedService: unknown = service;
    if (typeof normalizedService === "string") {
      try {
        const parsed = JSON.parse(normalizedService);
        if (Array.isArray(parsed)) {
          normalizedService = parsed;
        }
      } catch {
        // Keep as string if not valid JSON
      }
    }

    // Additional request (multi-select) - supports single or multiple selections
    if (Array.isArray(normalizedService) && normalizedService.length > 0) {
      const servicesMap: Record<string, string> = {
        "Private Label": "Private label",
        "Influancer Activation": "Influencer activation",
        "Influencer Activation": "Influencer activation",
        "Smart Platform": "Smart platform",
      };
      airtableFields["Additional request"] = normalizedService.map(
        (item) => servicesMap[item] ?? item
      );
    } else {
      const serviceStr = toStringField(normalizedService);
      if (serviceStr) {
        const servicesMap: Record<string, string> = {
          "Private Label": "Private label",
          "Influancer Activation": "Influencer activation",
          "Influencer Activation": "Influencer activation",
          "Smart Platform": "Smart platform",
        };
        const airtableService = servicesMap[serviceStr] ?? serviceStr;
        airtableFields["Additional request"] = airtableService;
      }
    }
    
    // Request Type - capitalize first letter (Merchandise or Services)
    const requestTypeStr = toStringField(requestType);
    if (requestTypeStr) {
      airtableFields["Request Type"] =
        requestTypeStr.charAt(0).toUpperCase() + requestTypeStr.slice(1);
    }
    
    // Preferred Type (Messenger) - map our messenger names to Airtable select options
    // Airtable options: Email, WhatsApp, Slack, Teams
    const preferredMessengerStr = toStringField(preferredMessenger);
    if (preferredMessengerStr) {
      // Map form messenger names to Airtable select options (exact match required)
      const messengerMap: Record<string, string> = {
        WhatsApp: "WhatsApp",
        Email: "Email",
        Slack: "Slack",
        Teams: "Teams",
      };
      const mappedMessenger = messengerMap[preferredMessengerStr];
      
      if (mappedMessenger) {
        airtableFields["Preferred Type"] = mappedMessenger;
      }
    }
    
    // Username or Phone - depends on messenger type
    // Airtable has: Phone (for WhatsApp) and Username (for others)
    const messengerContactStr = toStringField(messengerContact);
    if (messengerContactStr && !phoneStr) {
      // Only use messengerContact if phone wasn't provided directly (from contact form)
      const messengerName = preferredMessengerStr.toLowerCase() || "";

      if (messengerName === "whatsapp") {
        // For WhatsApp, use Phone field
        airtableFields["Phone"] = messengerContactStr;
      } else if (messengerName === "email") {
        // Email is already in Email field, skip contact info
      } else {
        // Slack, Teams, Telegram, Signal, Other, or unspecified — preserve the
        // raw handle in the Username field so it is never silently dropped.
        airtableFields["Username"] = messengerContactStr;
      }
    }

    // Create record in Airtable. typecast:true lets Airtable auto-create a
    // missing single-select option for Lead Source (e.g. when GGATE26 QR /
    // CBDO Back hasn't been added yet) and lossy-coerces other types.
    const airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
    const createRecord = async (fields: typeof airtableFields) =>
      fetchWithTimeout(airtableUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields,
          typecast: true,
        }),
      });

    let response = await createRecord(airtableFields);
    let sentFields = airtableFields;

    if (!response.ok) {
      const errorText = await response.text();

      // Drop fields the Airtable schema doesn't have. The conf override may
      // add fields like "Source Key" / "Campaign" / "Landing Page" / "Scan ID"
      // / "Visitor ID" that aren't always present. We also keep the legacy
      // behaviour of dropping Lead Source if it doesn't exist.
      const dropCandidates = [LEAD_SOURCE_FIELD, ...CONF_OPTIONAL_FIELDS];
      const fieldsToDrop = dropCandidates.filter(
        (field) =>
          errorText.includes("UNKNOWN_FIELD_NAME") &&
          errorText.includes(field) &&
          field in airtableFields
      );

      if (fieldsToDrop.length > 0) {
        const fallbackFields = { ...airtableFields };
        fieldsToDrop.forEach((field) => {
          delete fallbackFields[field];
        });
        console.warn("Airtable create retrying without unknown fields", {
          status: response.status,
          dropped: fieldsToDrop,
          originalError: errorText,
        });
        response = await createRecord(fallbackFields);
        sentFields = fallbackFields;
      }

      if (!response.ok) {
        const finalErrorText =
          fieldsToDrop.length > 0 ? await response.text() : errorText;
        console.error("Airtable create error", {
          status: response.status,
          details: finalErrorText,
          sentFields,
        });
        return NextResponse.json(
          {
            error: "Failed to create record in Airtable",
            details: finalErrorText,
            sentFields,
          },
          { status: response.status }
        );
      }
    }

    const data = await response.json();

    if (attachments.length > 0) {
      const recordId = data.id as string;
      const attachmentFieldName = "Attachments";
      const uploadUrl = `https://content.airtable.com/v0/${BASE_ID}/${recordId}/${encodeURIComponent(
        attachmentFieldName
      )}/uploadAttachment`;

      for (const file of attachments) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const contentType = file.type || "application/octet-stream";
        const filename = file.name || "attachment";

        const uploadResponse = await fetchWithTimeout(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: base64,
            filename,
            contentType,
          }),
        }, 15000);

        if (!uploadResponse.ok) {
          const uploadErrorText = await uploadResponse.text();
          return NextResponse.json(
            {
              error: "Failed to upload attachment to Airtable",
              details: uploadErrorText,
            },
            { status: uploadResponse.status }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      recordId: data.id,
      data: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to submit quote",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
