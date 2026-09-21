import { createContext } from "react";

// Holds requireAuth(action); see LoginPromptProvider.
export const LoginPromptContext = createContext(() => false);
