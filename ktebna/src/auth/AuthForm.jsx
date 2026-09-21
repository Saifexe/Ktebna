import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { AuthContext } from "./AuthProvider";
import Button from "../ui/Button";

const inputCls =
  "h-11 w-full rounded-md border bg-surface-soft px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring";

// Login / register form shared by the /login page and the login modal.
const AuthForm = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { login, register } = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(form);
        toast.success(t("auth.registered"));
      } else {
        await login({ email: form.email, password: form.password });
        toast.success(t("auth.loggedIn"));
      }
      onSuccess?.();
    } catch (error) {
      toast.error(error?.response?.data?.error || t("auth.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">
          {mode === "login" ? t("auth.welcome") : t("auth.create")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>
      </div>

      {mode === "register" && (
        <label className="block text-sm font-bold">
          {t("auth.name")}
          <input name="name" value={form.name} onChange={change} required autoComplete="name" className={`${inputCls} mt-1.5`} />
        </label>
      )}
      <label className="block text-sm font-bold">
        {t("auth.email")}
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={change}
          required
          autoComplete="email"
          className={`${inputCls} mt-1.5`}
        />
      </label>
      <label className="block text-sm font-bold">
        {t("auth.password")}
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={change}
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={`${inputCls} mt-1.5`}
        />
      </label>

      <Button type="submit" className="mt-1 h-11" disabled={submitting}>
        {submitting && <Loader2 className="animate-spin" />}
        {submitting ? t("auth.wait") : mode === "login" ? t("auth.login") : t("auth.register")}
      </Button>
      <Button variant="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? t("auth.toRegister") : t("auth.toLogin")}
      </Button>
    </form>
  );
};

export default AuthForm;
