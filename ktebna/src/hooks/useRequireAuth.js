import { useContext } from "react";
import { LoginPromptContext } from "../context/loginPrompt";

// Runs an action when logged in; otherwise opens the login modal.
export const useRequireAuth = () => useContext(LoginPromptContext);
