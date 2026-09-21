import { Dialog } from "@mui/material";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import AuthForm from "./AuthForm";

const LoginModal = ({ open, onClose, message }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <div className="relative bg-card p-6">
        <button
          onClick={onClose}
          className="absolute end-3 top-3 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label={t("sell.cancel")}
        >
          <X className="size-4" />
        </button>
        <p className="mb-4 rounded-md bg-accent p-3 text-center text-sm text-accent-foreground">
          {message || t("loginModal.defaultMessage")}
        </p>
        <AuthForm onSuccess={onClose} />
      </div>
    </Dialog>
  );
};

export default LoginModal;
