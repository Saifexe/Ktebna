import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  Button,
} from "@mui/material";
import { toast } from "react-toastify";
import apiClient from "../../apiClient";
import { useTranslation } from "react-i18next";

const UpdateProfilePictureModal = ({
  open,
  handleClose,
  userProfilePicture,
}) => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleUpdate = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await apiClient.post("/api/account/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      handleClose();
      setFile(null);
      setPreview(null);
      toast.success(t("updateProfilePictureModal.updateSuccess"));
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast.error(t("updateProfilePictureModal.updateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{t("updateProfilePictureModal.title")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <div className="flex justify-center">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <img
                src={userProfilePicture}
                alt="profile picture"
                className="w-32 h-32 rounded-full object-cover"
              />
            )}
          </div>
          <Button variant="outlined" component="label" sx={{ px: 12 }}>
            {t("updateProfilePictureModal.uploadImage")}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {t("updateProfilePictureModal.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={loading || !file}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("updateProfilePictureModal.update")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateProfilePictureModal;
