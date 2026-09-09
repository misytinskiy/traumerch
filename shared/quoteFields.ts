export const QUOTE_FIELD_IDS = {
  name: "fldwVqWkjS6F593gm",
  surname: "fldEi9wfScPzb1zW3",
  email: "fldIuu3d0fZQY5okp",
  phone: "fldmpJ0ogDI0c3Mb9",
  additionalRequest: "fldPHwrpNUDzC7A2F",
  preferredType: "fld1mVrYYyxPD1L2i",
  username: "fld0OyEiAX9rxHaP1",
  requestType: "flddIZjqV4rmmfK6E",
  descriptionQuoteNoCart: "fldGodTMkZ8Qky439",
  services: "flduUc4QDmwfAUral",
  description: "fldCCkiYbEIiEIOzD",
  companyName: "fldfPZmbGHqrr35K5",
  address: "fld4raGgm9uLjx3EV",
  apartment: "fldpb7JbK2BiAdJdR",
  postalCode: "fldirCMquKVWZCBLm",
  city: "fldaGb7WW03cJ4FDD",
  country: "fldOYBcgz8G7kPmaX",
  vatNumber: "fldXolLCaI4K4DCQQ",
  preferredDeliveryDate: "fldBRJXSyFX6hOQ9O",
  productQuantity: "fldQ5mSWWfJn7Go4B",
  attachments: "fld9A6aZ4NcPT062O",
  leadSource: "fldkuv52DEjxpKLNN",
  sourceKey: "fldFhOpUEgzR80Pc2",
  campaign: "fldNIN8dju7PQFfXo",
  landingPage: "fldPa0RvFLfYnzZP7",
  scanId: "fldalrqRjLsZ9kfGm",
  visitorId: "fldZnqfz3MykNWlDr",
} as const;

export type QuoteFieldKey = keyof typeof QUOTE_FIELD_IDS;

export const getQuoteFieldId = (key: QuoteFieldKey) => QUOTE_FIELD_IDS[key];
