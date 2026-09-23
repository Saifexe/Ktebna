import { describe, expect, it } from "vitest";
import i18n from "./i18n";
import CATEGORIES from "./data/categories";
import cities from "./data/cities";
import { CONDITIONS, DEAL_TYPES } from "./lib/listing";

// Every leaf key of a nested translation object, e.g. "auth.login".
const keysOf = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

const bundle = (lng) => i18n.getResourceBundle(lng, "translation");
const englishKeys = keysOf(bundle("en"));

describe.each(["fr", "ar"])("%s translation", (lng) => {
  it("has every string the English interface uses", () => {
    const keys = new Set(keysOf(bundle(lng)));
    expect(englishKeys.filter((key) => !keys.has(key))).toEqual([]);
  });

  it("labels every category, city, condition and deal type", () => {
    const has = (key) => i18n.exists(key, { lng, fallbackLng: false });
    const missing = [
      ...CATEGORIES.map((c) => `categories.${c}`),
      ...cities.map((c) => `cities.${c}`),
      ...CONDITIONS.map((c) => `conditions.${c}`),
      ...DEAL_TYPES.map((d) => `deal.${d}`),
    ].filter((key) => !has(key));
    expect(missing).toEqual([]);
  });
});

describe("document direction", () => {
  it("switches the page to right-to-left for Arabic and back", async () => {
    await i18n.changeLanguage("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    await i18n.changeLanguage("en");
    expect(document.documentElement.dir).toBe("ltr");
  });
});
