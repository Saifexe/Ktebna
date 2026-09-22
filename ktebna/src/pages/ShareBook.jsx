import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Camera, Loader2, Scale, Send, X } from "lucide-react";
import apiClient from "../apiClient";
import Button from "../ui/Button";
import CATEGORIES from "../data/categories";
import LIBRARY_LANGUAGES from "../data/libraryLanguages";

const EMPTY = { title: "", author: "", language: "", category: "", pdfUrl: "", description: "" };

const inputCls =
  "mt-2 h-12 w-full rounded-md border bg-surface-soft px-4 font-normal outline-none focus:ring-2 focus:ring-ring";

const Field = ({ label, error, children }) => (
  <label className="block text-sm font-bold">
    {label}
    {children}
    {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
  </label>
);

// "Share a book" for the free Library (/books/new).
const ShareBook = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const required = t("sell.required");
    const found = Object.fromEntries(
      Object.entries({
        title: !form.title.trim() && required,
        language: !form.language && required,
        pdfUrl: !form.pdfUrl.trim()
          ? required
          : !/^https?:\/\/\S+$/i.test(form.pdfUrl.trim()) && t("library.linkInvalid"),
      }).filter(([, message]) => message),
    );
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value.trim()) body.append(key, value.trim());
      });
      if (file) body.append("image", file);
      const { data } = await apiClient.post("/api/library", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("library.shared"));
      navigate(`/books/${data.id}`);
    } catch (error) {
      console.error("Sharing a library book failed:", error);
      toast.error(error?.response?.data?.error || t("library.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <X /> {t("sell.cancel")}
        </Button>
        <h1 className="font-display text-xl font-bold">{t("library.shareTitle")}</h1>
        <span className="w-20" />
      </div>

      <div className="mt-6 flex gap-3 rounded-md bg-trust-soft p-4 text-sm text-trust">
        <Scale className="size-5 shrink-0" />
        <p>{t("library.legalNote")}</p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6" noValidate>
        <div>
          <p className="text-sm font-bold">
            {t("library.cover")}{" "}
            <span className="font-normal text-muted-foreground">({t("map.optional")})</span>
          </p>
          <div className="mt-3 flex gap-3">
            {preview && (
              <img src={preview} alt={t("sell.preview")} className="h-32 w-24 rounded-md object-cover" />
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-32 w-32 flex-col items-center justify-center rounded-md border border-dashed transition-colors hover:border-primary hover:text-primary"
            >
              <Camera />
              <span className="mt-2 text-xs font-bold">
                {preview ? t("sell.changePhoto") : t("sell.addPhoto")}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }}
            />
          </div>
        </div>

        <Field label={t("sell.bookTitle")} error={errors.title}>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={200}
            className={`${inputCls} font-display text-lg font-bold`}
          />
        </Field>
        <Field label={t("sell.author")}>
          <input
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            maxLength={200}
            className={inputCls}
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t("library.language")} error={errors.language}>
            <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inputCls}>
              <option value="">{t("library.chooseLanguage")}</option>
              {LIBRARY_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {t(`library.languages.${l}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sell.category")}>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
              <option value="">{t("sell.chooseCategory")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t("library.pdfLink")} error={errors.pdfUrl}>
          <input
            type="url"
            value={form.pdfUrl}
            onChange={(e) => set("pdfUrl", e.target.value)}
            placeholder="https://…/book.pdf"
            maxLength={500}
            dir="ltr"
            className={inputCls}
          />
        </Field>
        <Field label={t("library.about")}>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={2000}
            className="mt-2 min-h-28 w-full rounded-md border bg-surface-soft p-3 font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Button type="submit" className="h-12 w-full" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <Send className="rtl:-scale-x-100" />}
          {submitting ? t("sell.publishing") : t("library.shareSubmit")}
        </Button>
      </form>
    </div>
  );
};

export default ShareBook;
