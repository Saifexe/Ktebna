import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import {
  chatLink,
  conditionTone,
  dealLabel,
  dealTone,
  formatDate,
  normalizeDealType,
  timeAgo,
} from "./listing";

const t = i18n.t.bind(i18n);

describe("deal and condition tones", () => {
  it("gives swaps and gifts the trust colour and sales the accent colour", () => {
    expect(dealTone("exchange")).toBe("trust");
    expect(dealTone("DONATE")).toBe("trust");
    expect(dealTone("sell")).toBe("accent");
    expect(dealTone(undefined)).toBe("accent");
  });

  it("highlights like-new and collector's copies", () => {
    expect(conditionTone("likeNew")).toBe("trust");
    expect(conditionTone("collectors")).toBe("trust");
    expect(conditionTone("wellLoved")).toBe("accent");
  });

  it("normalizes legacy deal types stored with arbitrary casing", () => {
    expect(normalizeDealType("Exchange")).toBe("exchange");
    expect(normalizeDealType(null)).toBe("");
  });
});

describe("dealLabel", () => {
  it("shows Free for gifts, whatever price was typed", () => {
    expect(dealLabel({ bookDealType: "donate", bookDeal: "20 TND" }, t)).toBe("Free");
  });

  it("shows what the seller wants in exchange for a swap", () => {
    expect(dealLabel({ bookDealType: "exchange", bookDeal: "Any sci-fi" }, t)).toBe("Swap · Any sci-fi");
  });

  it("falls back to the deal name when a swap or sale has no details", () => {
    expect(dealLabel({ bookDealType: "exchange" }, t)).toBe(t("deal.exchange"));
    expect(dealLabel({ bookDealType: "sell" }, t)).toBe(t("deal.sell"));
  });

  it("shows the price for a sale", () => {
    expect(dealLabel({ bookDealType: "sell", bookDeal: "15 TND" }, t)).toBe("15 TND");
  });
});

describe("dates", () => {
  afterEach(() => vi.useRealTimers());

  it("describes how long ago a listing was posted", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T12:00:00Z"));
    expect(timeAgo("2026-09-23T09:00:00Z")).toBe("3 hr. ago");
    expect(timeAgo("2026-09-20T12:00:00Z")).toBe("3 days ago");
    expect(timeAgo("2026-09-23T11:59:30Z")).toBe("this minute");
  });

  it("returns an empty string when there is no date", () => {
    expect(timeAgo(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });

  it("formats a full date in the reader's language", () => {
    expect(formatDate("2026-09-23T12:00:00Z", "en")).toBe("September 23, 2026");
  });
});

describe("chatLink", () => {
  it("opens a chat with the seller about this book", () => {
    const link = chatLink({ bookName: "Dune", user: { id: 3, name: "Saif Ed" } });
    expect(link).toBe("/messages?with=3&name=Saif+Ed&book=Dune");
  });

  it("still builds a link when the seller's details are missing", () => {
    expect(chatLink({})).toBe("/messages?with=");
  });
});
