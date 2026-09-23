import { describe, expect, it } from "vitest";
import apiClient, { API_BASE_URL, mediaUrl } from "./apiClient";

// The interceptors are the first registered handlers on the shared client.
const onRequest = apiClient.interceptors.request.handlers[0].fulfilled;
const onError = apiClient.interceptors.response.handlers[0].rejected;

describe("request interceptor", () => {
  it("attaches the saved token to every request", () => {
    localStorage.setItem("ktebna_token", "abc.def.ghi");
    const config = onRequest({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer abc.def.ghi");
  });

  it("sends no Authorization header when logged out", () => {
    const config = onRequest({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe("response interceptor", () => {
  it("forgets an expired token when the backend answers 401", async () => {
    localStorage.setItem("ktebna_token", "expired");
    const error = { response: { status: 401 } };
    await expect(onError(error)).rejects.toBe(error);
    expect(localStorage.getItem("ktebna_token")).toBeNull();
  });

  it("keeps the token for other errors, such as 403", async () => {
    localStorage.setItem("ktebna_token", "valid");
    await expect(onError({ response: { status: 403 } })).rejects.toBeTruthy();
    expect(localStorage.getItem("ktebna_token")).toBe("valid");
  });

  it("copes with network errors that have no response", async () => {
    await expect(onError(new Error("offline"))).rejects.toThrow("offline");
  });
});

describe("mediaUrl", () => {
  it("serves uploaded images from the API host", () => {
    // Empty behind nginx (same-origin); the backend's URL with the Vite dev server.
    expect(mediaUrl("/uploads/cover.jpg")).toBe(`${API_BASE_URL}/uploads/cover.jpg`);
  });

  it("leaves external and missing images untouched", () => {
    expect(mediaUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
    expect(mediaUrl(null)).toBeNull();
  });
});
