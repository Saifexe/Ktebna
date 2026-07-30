import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Divider,
  Box,
  Button,
  TextField,
} from "@mui/material";
import { X } from "lucide-react";
import { useContext, useState } from "react";
import { AuthContext } from "./AuthProvider";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const LoginModal = ({ open, onClose, message }) => {
  const { t } = useTranslation();
  const displayMessage = message || t("loginModal.defaultMessage");
  const { login, register } = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(form);
        toast.success("Account created!");
      } else {
        await login({ email: form.email, password: form.password });
        toast.success("Welcome back!");
      }
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          bgcolor: "#d97706",
          color: "#fff",
          py: 1,
        }}
      >
        <DialogTitle sx={{ textAlign: "center", m: 0, fontSize: "1.25rem" }}>
          {t("loginModal.title")}
        </DialogTitle>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#fff",
          }}
        >
          <X size={14} />
        </IconButton>
      </Box>

      <DialogContent sx={{ textAlign: "center", pt: 3, px: 4, pb: 4 }}>
        <Typography variant="body1" gutterBottom>
          {displayMessage}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <TextField
              name="name"
              label="Full name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
              size="small"
            />
          )}
          <TextField
            name="email"
            type="email"
            label="Email"
            value={form.email}
            onChange={handleChange}
            required
            fullWidth
            size="small"
          />
          <TextField
            name="password"
            type="password"
            label="Password"
            value={form.password}
            onChange={handleChange}
            required
            inputProps={{ minLength: 6 }}
            fullWidth
            size="small"
          />
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              textTransform: "none",
              backgroundColor: "#d97706",
              "&:hover": { backgroundColor: "#b45309" },
            }}
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Sign up"}
          </Button>
          <Button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            {mode === "login"
              ? "No account yet? Sign up"
              : "Already have an account? Log in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
