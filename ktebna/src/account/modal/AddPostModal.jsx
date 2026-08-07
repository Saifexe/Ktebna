import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  Typography,
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

const AddPostModal = ({ open, onClose, onAdd }) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      name: "",
      category: "",
      deal: "",
      type: "",
      location: "",
      image: null,
    },
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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

      const { data: newPost } = await apiClient.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Let the parent (react-query) know a post was created so it can refresh.
      onAdd(newPost);

      toast.success(t("addPostModal.productAddSuccess"));
      reset();
      setImagePreview(null);
      setFile(null);
      onClose();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(t("addPostModal.productAddError"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {t("addPostModal.title")}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Controller
            name="image"
            control={control}
            rules={{ required: t("addPostModal.imageRequired") }}
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
                  {t("addPostModal.uploadImage")}
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
                {errors.image && (
                  <Typography color="error">{errors.image.message}</Typography>
                )}
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
            rules={{ required: t("addPostModal.nameRequired") }}
            render={({ field }) => (
              <TextField
                label={t("addPostModal.bookName")}
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
            rules={{ required: t("addPostModal.categoryRequired") }}
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
                <InputLabel>{t("addPostModal.bookCategory")}</InputLabel>
                <Select {...field} label={t("addPostModal.bookCategory")}>
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
              rules={{ required: t("addPostModal.typeRequired") }}
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
                  <InputLabel>{t("addPostModal.dealType")}</InputLabel>
                  <Select {...field} label={t("addPostModal.dealType")}>
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
              rules={{ required: t("addPostModal.fieldRequired") }}
              render={({ field }) => (
                <TextField
                  label={t("addPostModal.priceOrExchange")}
                  placeholder={t("addPostModal.priceExchangePlaceholder")}
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
            rules={{ required: t("addPostModal.locationRequired") }}
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
                <InputLabel>{t("addPostModal.bookLocation")}</InputLabel>
                <Select {...field} label={t("addPostModal.bookLocation")}>
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
            {t("addPostModal.cancel")}
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
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading
              ? t("addPostModal.mayTakeMinutes")
              : t("addPostModal.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddPostModal;
