import React, { useState } from "react";
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
import { useTranslation } from "react-i18next";

const DeletePostModal = ({ open, onClose, post, onDelete }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      onDelete(post);

      toast.success(t("deletePostModal.deleteSuccess"));
      onClose();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(t("deletePostModal.deleteError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("deletePostModal.title")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography align="center">
          {t("deletePostModal.confirmMessage")}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => onClose(false)}
          color="inherit"
          sx={{ textTransform: "none" }}
        >
          {t("deletePostModal.cancel")}
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
          sx={{ textTransform: "none" }}
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

export default DeletePostModal;
