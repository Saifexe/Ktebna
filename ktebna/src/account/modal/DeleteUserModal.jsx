import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import apiClient from "../../apiClient";
import { AuthContext } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";

const DeleteUserModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiClient.delete("/api/account");

      toast.success(t("deleteAccountModal.deleteSuccess"));
      await logout();
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t("deleteAccountModal.deleteError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("deleteAccountModal.title")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography align="center">
          {t("deleteAccountModal.confirmMessage")}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} color="inherit">
          {t("deletePostModal.cancel")}
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            t("deletePostModal.delete")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserModal;
