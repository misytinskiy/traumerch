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

    console.log("=== AIRTABLE QUOTE API - REQUEST BODY ===");
    console.log("Full body:", JSON.stringify(body, null, 2));
    console.log("Attachments count:", attachments.length);
    
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
      useSameAddressForShipping,
      productQuantity,
      preferredMessenger,
      messengerContact,
      requestType,
      service,
      description,
    } = body;

    console.log("=== EXTRACTED VALUES ===");
    console.log("name:", name);
    console.log("surname:", surname);
    console.log("email:", email);
    console.log("phone:", phone);
    console.log("companyName:", companyName);
    console.log("address:", address);
    console.log("apartment:", apartment);
    console.log("postalCode:", postalCode);
    console.log("city:", city);
    console.log("country:", country);
    console.log("vatNumber:", vatNumber);
    console.log("preferredDeliveryDate:", preferredDeliveryDate);
    console.log("useSameAddressForShipping:", useSameAddressForShipping);
    console.log("productQuantity:", productQuantity);
    console.log("preferredMessenger:", preferredMessenger, "(type:", typeof preferredMessenger, ")");
    console.log("messengerContact:", messengerContact);
    console.log("requestType:", requestType);
    console.log("service:", service);
    console.log("description:", description);

    const toStringField = (value: unknown) =>
      typeof value === "string" ? value : value == null ? "" : String(value);

    // Map form data to Airtable fields based on actual table structure
    // Fields: Name, Surname, Email, Phone, Company name, Address, Apartment, Postal code, City, Country, Vat number, Preferred delivery date, Use the same address for shipping, Product quantity
    // Also supports: Preferred Type, Username, Description, Request Type, Services (from QuoteOverlay)
    const airtableFields: Record<
      string,
      string | number | boolean | Array<{ url: string; filename?: string }>
    > = {};
    
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
    if (useSameAddressForShipping !== undefined) {
      const useSame =
        typeof useSameAddressForShipping === "string"
          ? useSameAddressForShipping === "true"
          : Boolean(useSameAddressForShipping);
      airtableFields["Use the same address for shipping"] = useSame;
    }
    if (productQuantity !== undefined && productQuantity !== null) {
      // Убеждаемся, что отправляется как целое число (integer)
      const qtyNum = typeof productQuantity === 'string' 
        ? parseInt(productQuantity, 10) 
        : Math.floor(Number(productQuantity));
      
      console.log("=== PRODUCT QUANTITY PROCESSING ===");
      console.log("productQuantity raw:", productQuantity, "(type:", typeof productQuantity, ")");
      console.log("qtyNum:", qtyNum, "(type:", typeof qtyNum, ", isNaN:", Number.isNaN(qtyNum), ")");
      
      if (!Number.isNaN(qtyNum) && qtyNum > 0 && Number.isInteger(qtyNum)) {
        // Пробуем разные варианты названия поля
        // Airtable может требовать точное совпадение названия поля
        const fieldNames = [
          "Product quantity",
          "product quantity",
          "Product Quantity",
          "Quantity",
          "quantity",
        ];
        
        // Airtable field is single line text, so send as string
        const qtyStr = String(qtyNum);
        // Пробуем первое название (наиболее вероятное)
        airtableFields["Product quantity"] = qtyStr;
        console.log("✅ Set Product quantity to:", qtyStr, "(type:", typeof qtyStr, ")");
        console.log("✅ Trying field name: 'Product quantity'");
      } else {
        console.log("⚠️ Invalid productQuantity value:", productQuantity, "->", qtyNum);
        console.log("⚠️ Conditions: isNaN:", Number.isNaN(qtyNum), ", > 0:", qtyNum > 0, ", isInteger:", Number.isInteger(qtyNum));
      }
    } else {
      console.log("ℹ️ productQuantity is undefined or null");
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

    // Services - single select (exact Airtable option names required)
    const serviceStr = toStringField(service);
    if (serviceStr) {
      const servicesMap: Record<string, string> = {
        "Private Label": "Private label",
        "Influancer Activation": "Influancer Activation",
        "Smart Platform": "Smart Platform",
      };
      const airtableService = servicesMap[serviceStr] ?? serviceStr;
      airtableFields["Services"] = airtableService;
      console.log("✅ Set Services to:", airtableService);
    }
    
    // Request Type - capitalize first letter (Merchandise or Services)
    const requestTypeStr = toStringField(requestType);
    if (requestTypeStr) {
      airtableFields["Request Type"] =
        requestTypeStr.charAt(0).toUpperCase() + requestTypeStr.slice(1);
    }
    
    // Preferred Type (Messenger) - map our messenger names to Airtable select options
    // Airtable options: Email, WhatsApp, Slack, Teams
    console.log("=== PREFERRED MESSENGER MAPPING ===");
    console.log("preferredMessenger value:", preferredMessenger);
    console.log("preferredMessenger type:", typeof preferredMessenger);
    console.log("preferredMessenger truthy?", !!preferredMessenger);
    
    const preferredMessengerStr = toStringField(preferredMessenger);
    if (preferredMessengerStr) {
      // Map form messenger names to Airtable select options (exact match required)
      const messengerMap: Record<string, string> = {
        WhatsApp: "WhatsApp",
        Email: "Email",
        Slack: "Slack",
        Teams: "Teams",
      };
      
      console.log("messengerMap:", messengerMap);
      console.log("Looking for key:", preferredMessengerStr);
      console.log("Key exists in map?", preferredMessengerStr in messengerMap);
      
      const mappedMessenger = messengerMap[preferredMessengerStr];
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
    
    const messengerContactStr = toStringField(messengerContact);
    if (messengerContactStr && !phoneStr) {
      // Only use messengerContact if phone wasn't provided directly (from contact form)
      const messengerName = preferredMessengerStr.toLowerCase() || "";
      console.log("messengerName (lowercase):", messengerName);
      
      if (messengerName === "whatsapp") {
        // For WhatsApp, use Phone field
        airtableFields["Phone"] = messengerContactStr;
        console.log("✅ Set Phone to:", messengerContactStr);
      } else if (messengerName === "email") {
        // Email is already in Email field, skip contact info
        console.log("ℹ️ Email selected - contact info not needed");
      } else if (messengerName === "teams" || messengerName === "slack") {
        // For Teams, Slack, etc., use Username field
        airtableFields["Username"] = messengerContactStr;
        console.log("✅ Set Username to:", messengerContactStr);
      } else {
        console.log("⚠️ Unknown messenger type for contact:", messengerName);
      }
    } else {
      console.log("ℹ️ No messengerContact provided or phone already set");
    }
    
    console.log("=== FINAL AIRTABLE FIELDS ===");
    console.log("Sending to Airtable:", JSON.stringify(airtableFields, null, 2));
    console.log("Product quantity field:", airtableFields["Product quantity"], "(type:", typeof airtableFields["Product quantity"], ")");
    
    // Проверяем типы всех полей перед отправкой
    Object.entries(airtableFields).forEach(([key, value]) => {
      console.log(`Field "${key}":`, value, "(type:", typeof value, ")");
    });

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
      console.error("Airtable API error response:", errorText);
      console.error("Request body that was sent:", JSON.stringify({ fields: airtableFields }, null, 2));
      
      // Попробуем распарсить ошибку для более детальной информации
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Parsed error:", JSON.stringify(errorJson, null, 2));
      } catch {
        console.error("Could not parse error as JSON");
      }
      
      return NextResponse.json(
        {
          error: "Failed to create record in Airtable",
          details: errorText,
          sentFields: airtableFields,
        },
        { status: response.status }
      );
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

        const uploadResponse = await fetch(uploadUrl, {
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
        });

        if (!uploadResponse.ok) {
          const uploadErrorText = await uploadResponse.text();
          console.error("Airtable attachment upload error:", uploadErrorText);
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
