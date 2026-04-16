"use client";

type EventValue = string | number | boolean | null | undefined;

type EventPayload = Record<string, EventValue>;

type DataLayerEvent = EventPayload & {
  event: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function pushDataLayerEvent(event: string, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const eventPayload: DataLayerEvent = { event, ...payload };
  window.dataLayer.push(eventPayload);
}
