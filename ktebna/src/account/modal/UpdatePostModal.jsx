import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  FormHelperText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import apiClient from "../../apiClient";
import { toast } from "react-toastify";
import cities from "../../data/cities";
import CATEGORIES from "../../data/categories";
import { useTranslation } from "react-i18next";

const UpdatePostModal = ({ open, onClose, post }) => {
  const { t } = useTranslation();
  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      category: "",
      type: "",
      deal: "",
      location: "",
      image: null,
    },
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (post) {
      reset({
        name: post.bookName || "",
        category: post.bookCategory || "",
        type: post.bookDealType || "",
        deal: post.bookDeal || "",
        location: post.bookLocation || "",
        image: null,
      });
      setImagePreview(post.bookImage || null);
    }
  }, [post, reset]);

  if (!open) return null;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("bookName", data.name);
      formData.append("bookCategory", data.category);
      formData.append("bookDealType", data.type);
      formData.append("bookDeal", data.deal);
      formData.append("bookLocation", data.location);
      if (file) formData.append("image", file);

      await apiClient.put(`/api/posts/${post.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(t("updatePostModal.postUpdateSuccess"));
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error(t("updatePostModal.postUpdateError"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("updatePostModal.title")}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <div style={{ marginBottom: 20 }}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    color: "#d97706",
                    borderColor: "#d97706",
                    "&:hover": {
                      borderColor: "#b45309",
                      backgroundColor: "rgba(217, 119, 6, 0.04)",
                    },
                  }}
                >
                  {imagePreview
                    ? t("updatePostModal.changeImage")
                    : t("updatePostModal.uploadImage")}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setFile(file);
                      field.onChange(file);
                      setImagePreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                </Button>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 aspect-3/4 object-cover mt-2"
                  />
                )}
              </div>
            )}
          />

          <Controller
            name="name"
            control={control}
            rules={{ required: t("updatePostModal.nameRequired") }}
            render={({ field }) => (
              <TextField
                label={t("updatePostModal.bookName")}
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
                {...field}
                sx={{
                  "& label.Mui-focused": { color: "#d97706" },
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: "#b45309" },
                    "&.Mui-focused fieldset": { borderColor: "#d97706" },
                  },
                }}
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            rules={{ required: t("updatePostModal.categoryRequired") }}
            render={({ field }) => (
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.category}
                sx={{
                  "& label.Mui-focused": { color: "#d97706" },
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: "#b45309" },
                    "&.Mui-focused fieldset": { borderColor: "#d97706" },
                  },
                }}
              >
                <InputLabel>{t("updatePostModal.bookCategory")}</InputLabel>
                <Select {...field} label={t("updatePostModal.bookCategory")}>
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {t(`categories.${c}`)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.category?.message}</FormHelperText>
              </FormControl>
            )}
          />

          <div className="flex gap-2">
            <Controller
              name="type"
              control={control}
              rules={{ required: t("updatePostModal.typeRequired") }}
              render={({ field }) => (
                <FormControl
                  fullWidth
                  margin="normal"
                  error={!!errors.type}
                  sx={{
                    "& label.Mui-focused": { color: "#d97706" },
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#b45309" },
                      "&.Mui-focused fieldset": { borderColor: "#d97706" },
                    },
                  }}
                >
                  <InputLabel>{t("updatePostModal.dealType")}</InputLabel>
                  <Select {...field} label={t("updatePostModal.dealType")}>
                    {["sell", "exchange", "donate"].map((c) => (
                      <MenuItem key={c} value={c}>
                        {t(`filterPanel.${c}`)}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.type?.message}</FormHelperText>
                </FormControl>
              )}
            />
            <Controller
              name="deal"
              control={control}
              rules={{ required: t("updatePostModal.fieldRequired") }}
              render={({ field }) => (
                <TextField
                  label={t("updatePostModal.priceOrExchange")}
                  placeholder={t("updatePostModal.priceExchangePlaceholder")}
                  type="text"
                  fullWidth
                  margin="normal"
                  error={!!errors.deal}
                  helperText={errors.deal?.message}
                  {...field}
                  sx={{
                    "& label.Mui-focused": { color: "#d97706" },
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#b45309" },
                      "&.Mui-focused fieldset": { borderColor: "#d97706" },
                    },
                  }}
                />
              )}
            />
          </div>

          <Controller
            name="location"
            control={control}
            rules={{ required: t("updatePostModal.locationRequired") }}
            render={({ field }) => (
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.location}
                sx={{
                  "& label.Mui-focused": { color: "#d97706" },
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: "#b45309" },
                    "&.Mui-focused fieldset": { borderColor: "#d97706" },
                  },
                }}
              >
                <InputLabel>{t("updatePostModal.bookLocation")}</InputLabel>
                <Select {...field} label={t("updatePostModal.bookLocation")}>
                  {cities.map((c) => (
                    <MenuItem key={c} value={c}>
                      {t(`cities.${c}`)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.location?.message}</FormHelperText>
              </FormControl>
            )}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{
              textTransform: "none",
            }}
          >
            {t("updatePostModal.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              textTransform: "none",
              backgroundColor: "#d97706",
              "&:hover": {
                backgroundColor: "#b45309",
              },
            }}
            disabled={!isValid || loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              t("updatePostModal.update")
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UpdatePostModal;
