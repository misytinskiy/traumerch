// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import en from "../locales/en.json";
import QuoteOverlay from "../components/QuoteOverlay/QuoteOverlay";

const closeQuoteMock = vi.fn();

vi.mock("../contexts/QuoteOverlayContext", () => ({
  useQuoteOverlay: () => ({ isOpen: true, closeQuote: closeQuoteMock }),
}));

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: en, language: "en" }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { alt, ...rest } = props;
    return <img alt={alt} {...rest} />;
  },
}));

vi.mock("react-calendly", () => ({
  InlineWidget: () => <div data-testid="calendly" />,
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const motion = new Proxy(
    {},
    {
      get: (_target, tag) => {
        const Tag = tag as string;
        return React.forwardRef((props: any, ref) =>
          React.createElement(Tag, { ...props, ref })
        );
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

const makeFile = (name: string, size: number) =>
  new File([new Uint8Array(size)], name, { type: "image/png" });

describe("QuoteOverlay file validation", () => {
  beforeEach(() => {
    closeQuoteMock.mockReset();
    if (!window.scrollTo) {
      // happy-dom may not implement scrollTo
      window.scrollTo = () => {};
    }
  });

  afterEach(() => {
    cleanup();
  });

  it("shows error when exceeding max files", () => {
    render(<QuoteOverlay />);

    const input = screen.getByLabelText(en.quote.fileUpload);
    const files = Array.from({ length: 6 }).map((_, i) =>
      makeFile(`file${i}.png`, 1024)
    );

    fireEvent.change(input, { target: { files } });

    expect(
      screen.getByText("Maximum 5 files allowed.")
    ).toBeInTheDocument();
    expect(screen.queryByText("file0.png")).not.toBeInTheDocument();
  });

  it("shows error when total size exceeds limit", () => {
    render(<QuoteOverlay />);

    const input = screen.getByLabelText(en.quote.fileUpload);
    const tooLarge = [
      makeFile("a.png", 8 * 1024 * 1024),
      makeFile("b.png", 8 * 1024 * 1024),
    ];

    fireEvent.change(input, { target: { files: tooLarge } });

    expect(
      screen.getByText("Total size must be 15 MB or less.")
    ).toBeInTheDocument();
    expect(screen.queryByText("a.png")).not.toBeInTheDocument();
  });
});
