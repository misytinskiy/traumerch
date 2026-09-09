import { NextRequest, NextResponse } from "next/server";
import { getQuoteFieldId } from "../../../shared/quoteFields";

const BASE_ID = process.env.QUOTE_BASE_ID;
const TABLE_ID = process.env.QUOTE_TABLE_ID;
const apiToken = process.env.API_TOKEN;
const WEBSITE_LEAD_SOURCE_VALUE = "Website";

// /conf override — server-side whitelist. We do NOT trust an arbitrary "source"
// label from the client. The override only triggers when the client sends the
// exact (sourceKey, campaign) pair below, in which case we use the hard-coded
// Lead Source value. Anything else falls back to the regular Website value.
const CONF_SOURCE_KEY = "conf_qr";
const CONF_CAMPAIGN = "ggate26";
const CONF_LEAD_SOURCE_VALUE = "GGATE26 QR / CBDO Back";
const CONF_LANDING_PAGE = "/conf";

// Optional extra fields written only when the /conf override matches. We can
// selectively drop them if Airtable's schema rejects any of them.
const CONF_OPTIONAL_FIELDS = [
  "sourceKey",
  "campaign",
  "landingPage",
  "scanId",
  "visitorId",
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
  if (!apiToken || !BASE_ID || !TABLE_ID) {
    return NextResponse.json(
      { error: "Missing Airtable configuration" },
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
      sourceKey,
      campaign,
      landingPage,
      scanId,
      visitorId,
    } = body;

    const toStringField = (value: unknown) =>
      typeof value === "string" ? value : value == null ? "" : String(value);

    const airtableFields: Record<
      string,
      | string
      | number
      | boolean
      | string[]
      | Array<{ url: string; filename?: string }>
    > = {};

    const isConfSubmission =
      toStringField(sourceKey).toLowerCase() === CONF_SOURCE_KEY &&
      toStringField(campaign).toLowerCase() === CONF_CAMPAIGN;

    airtableFields[getQuoteFieldId("leadSource")] = isConfSubmission
      ? CONF_LEAD_SOURCE_VALUE
      : WEBSITE_LEAD_SOURCE_VALUE;

    if (isConfSubmission) {
      airtableFields[getQuoteFieldId("sourceKey")] = CONF_SOURCE_KEY;
      airtableFields[getQuoteFieldId("campaign")] = CONF_CAMPAIGN;

      const landingPageStr = toStringField(landingPage);
      airtableFields[getQuoteFieldId("landingPage")] =
        landingPageStr || CONF_LANDING_PAGE;

      const scanIdStr = toStringField(scanId);
      if (scanIdStr) {
        airtableFields[getQuoteFieldId("scanId")] = scanIdStr;
      }

      const visitorIdStr = toStringField(visitorId);
      if (visitorIdStr) {
        airtableFields[getQuoteFieldId("visitorId")] = visitorIdStr;
      }
    }

    const nameStr = toStringField(name);
    if (nameStr) airtableFields[getQuoteFieldId("name")] = nameStr;

    const surnameStr = toStringField(surname);
    if (surnameStr) airtableFields[getQuoteFieldId("surname")] = surnameStr;

    const emailStr = toStringField(email);
    if (emailStr) airtableFields[getQuoteFieldId("email")] = emailStr;

    const phoneStr = toStringField(phone);
    if (phoneStr) airtableFields[getQuoteFieldId("phone")] = phoneStr;

    const companyNameStr = toStringField(companyName);
    if (companyNameStr) {
      airtableFields[getQuoteFieldId("companyName")] = companyNameStr;
    }

    const addressStr = toStringField(address);
    if (addressStr) airtableFields[getQuoteFieldId("address")] = addressStr;

    const apartmentStr = toStringField(apartment);
    if (apartmentStr) {
      airtableFields[getQuoteFieldId("apartment")] = apartmentStr;
    }

    const postalCodeStr = toStringField(postalCode);
    if (postalCodeStr) {
      airtableFields[getQuoteFieldId("postalCode")] = postalCodeStr;
    }

    const cityStr = toStringField(city);
    if (cityStr) airtableFields[getQuoteFieldId("city")] = cityStr;

    const countryStr = toStringField(country);
    if (countryStr) airtableFields[getQuoteFieldId("country")] = countryStr;

    const vatNumberStr = toStringField(vatNumber);
    if (vatNumberStr) {
      airtableFields[getQuoteFieldId("vatNumber")] = vatNumberStr;
    }

    const preferredDeliveryDateStr = toStringField(preferredDeliveryDate);
    if (preferredDeliveryDateStr) {
      airtableFields[getQuoteFieldId("preferredDeliveryDate")] =
        preferredDeliveryDateStr;
    }

    if (productQuantity !== undefined && productQuantity !== null) {
      const qtyNum =
        typeof productQuantity === "string"
          ? parseInt(productQuantity, 10)
          : Math.floor(Number(productQuantity));

      if (!Number.isNaN(qtyNum) && qtyNum > 0 && Number.isInteger(qtyNum)) {
        airtableFields[getQuoteFieldId("productQuantity")] = String(qtyNum);
      }
    }

    const descriptionStr = toStringField(description);
    if (descriptionStr) {
      airtableFields[getQuoteFieldId("description")] = descriptionStr;
    }

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

    if (Array.isArray(normalizedService) && normalizedService.length > 0) {
      const servicesMap: Record<string, string> = {
        "Private Label": "Private label",
        "Influancer Activation": "Influencer activation",
        "Influencer Activation": "Influencer activation",
        "Smart Platform": "Smart platform",
      };
      airtableFields[getQuoteFieldId("additionalRequest")] = normalizedService.map(
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
        airtableFields[getQuoteFieldId("additionalRequest")] =
          servicesMap[serviceStr] ?? serviceStr;
      }
    }

    const requestTypeStr = toStringField(requestType);
    if (requestTypeStr) {
      airtableFields[getQuoteFieldId("requestType")] =
        requestTypeStr.charAt(0).toUpperCase() + requestTypeStr.slice(1);
    }

    const preferredMessengerStr = toStringField(preferredMessenger);
    if (preferredMessengerStr) {
      const messengerMap: Record<string, string> = {
        WhatsApp: "WhatsApp",
        Email: "Email",
        Slack: "Slack",
        Teams: "Teams",
      };
      const mappedMessenger = messengerMap[preferredMessengerStr];
      if (mappedMessenger) {
        airtableFields[getQuoteFieldId("preferredType")] = mappedMessenger;
      }
    }

    const messengerContactStr = toStringField(messengerContact);
    if (messengerContactStr && !phoneStr) {
      const messengerName = preferredMessengerStr.toLowerCase() || "";

      if (messengerName === "whatsapp") {
        airtableFields[getQuoteFieldId("phone")] = messengerContactStr;
      } else if (messengerName !== "email") {
        airtableFields[getQuoteFieldId("username")] = messengerContactStr;
      }
    }

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
      const dropCandidates = ["leadSource", ...CONF_OPTIONAL_FIELDS] as const;
      const fieldsToDrop = dropCandidates.filter((fieldKey) => {
        const fieldId = getQuoteFieldId(fieldKey);
        return (
          errorText.includes("UNKNOWN_FIELD_NAME") &&
          errorText.includes(fieldId) &&
          fieldId in airtableFields
        );
      });

      if (fieldsToDrop.length > 0) {
        const fallbackFields = { ...airtableFields };
        fieldsToDrop.forEach((fieldKey) => {
          delete fallbackFields[getQuoteFieldId(fieldKey)];
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
      const uploadUrl = `https://content.airtable.com/v0/${BASE_ID}/${recordId}/${encodeURIComponent(
        getQuoteFieldId("attachments")
      )}/uploadAttachment`;

      for (const file of attachments) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const contentType = file.type || "application/octet-stream";
        const filename = file.name || "attachment";

        const uploadResponse = await fetchWithTimeout(
          uploadUrl,
          {
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
          },
          15000
        );

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
      data,
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
