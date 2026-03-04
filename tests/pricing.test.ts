import { describe, expect, it } from "vitest";
import {
  getMinQuantity,
  getPriceForQuantity,
  getUnitPriceForQuantity,
} from "../shared/pricing";

describe("pricing helpers", () => {
  it("selects the correct price tier and formats unit price", () => {
    const fields = {
      "1-24 pcs (Sample) | SALES": "€6",
      "24-49 pcs | SALES": "5.5",
      "1000+ pcs | SALES": 3,
    };

    expect(getUnitPriceForQuantity(1, fields)).toBe("€6");
    expect(getUnitPriceForQuantity(25, fields)).toBe("€5.5");
    expect(getUnitPriceForQuantity(1500, fields)).toBe("€3");
  });

  it("computes total price for quantity", () => {
    const fields = {
      "24-49 pcs | SALES": "5.5",
    };

    expect(getPriceForQuantity(25, fields)).toBe("€137.5");
  });

  it("returns a safe minimum quantity", () => {
    expect(getMinQuantity(undefined)).toBe(1);
    expect(getMinQuantity({ "MOQ | SALES": "25" })).toBe(25);
    expect(getMinQuantity({ "# MOQ": 0 })).toBe(1);
    expect(getMinQuantity({ MOQ: 999999 })).toBe(99999);
  });
});
