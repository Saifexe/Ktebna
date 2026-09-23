import { describe, expect, it } from "vitest";
import cities from "../data/cities";
import { cityCenter, googleMapsLink, hasPin } from "./maps";

describe("cityCenter", () => {
  it("knows the centre of every city a listing can pick", () => {
    cities.forEach((city) => expect(cityCenter(city), city).not.toBeNull());
  });

  it("returns null for an unknown city", () => {
    expect(cityCenter("Paris")).toBeNull();
  });
});

describe("hasPin", () => {
  it("accepts only real coordinates", () => {
    expect(hasPin(36.8, 10.18)).toBe(true);
    expect(hasPin(0, 0)).toBe(true);
    expect(hasPin(null, 10)).toBe(false);
    expect(hasPin(Number.NaN, 10)).toBe(false);
  });
});

describe("googleMapsLink", () => {
  it("points at the exact pin when the seller dropped one", () => {
    expect(googleMapsLink({ lat: 36.8, lng: 10.18, spot: "Café", city: "Tunis" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=36.8%2C10.18",
    );
  });

  it("searches for the meeting spot and city when there is no pin", () => {
    expect(googleMapsLink({ spot: "Central Library", city: "Sfax" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Central%20Library%2C%20Sfax%2C%20Tunisia",
    );
  });

  it("falls back to the city alone", () => {
    expect(googleMapsLink({ city: "Béja" })).toContain(encodeURIComponent("Béja, Tunisia"));
  });
});
