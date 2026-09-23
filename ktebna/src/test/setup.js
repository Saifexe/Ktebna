import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "../i18n";

// Tests assert on the real English strings, so a renamed key fails loudly.
beforeAll(() => i18n.changeLanguage("en"));

afterEach(() => {
  cleanup();
  localStorage.clear();
});
