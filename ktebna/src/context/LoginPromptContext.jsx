import { useCallback, useContext, useState } from "react";
import { AuthContext } from "../auth/AuthProvider";
import LoginModal from "../auth/LoginModal";
import { LoginPromptContext } from "./loginPrompt";

// Wraps an action that needs an account: runs it when logged in, otherwise
// opens the login modal and returns false.
export const LoginPromptProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  const requireAuth = useCallback(
    (action) => {
      if (user) {
        action?.();
        return true;
      }
      setOpen(true);
      return false;
    },
    [user],
  );

  return (
    <LoginPromptContext.Provider value={requireAuth}>
      {children}
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </LoginPromptContext.Provider>
  );
};
