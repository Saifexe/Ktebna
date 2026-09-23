import { vi } from "vitest";

// Stand-in for ../apiClient in page tests: vi.mock("../apiClient", () => import("../test/apiClientMock")).
const apiClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };

export const mediaUrl = (path) => path;
export const API_BASE_URL = "";
export default apiClient;
