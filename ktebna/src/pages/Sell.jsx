import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Camera, ChevronLeft, Lightbulb, Loader2, Send, ShieldCheck, X } from "lucide-react";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import BookCard from "../components/BookCard";
import PickupPicker from "../components/maps/PickupPicker";
import { CONDITIONS, DEAL_TYPES, normalizeDealType } from "../lib/listing";
import CATEGORIES from "../data/categories";
import cities from "../data/cities";

const EMPTY = {
  bookName: "",
  bookAuthor: "",
  bookCategory: "",
  bookCondition: "",
  bookDealType: "",
  bookDeal: "",
  bookDescription: "",
  bookLocation: "",
  pickupLat: null,
  pickupLng: null,
  pickupSpot: "",
  isPublic: true,
};

const inputCls =
  "mt-2 h-12 w-full rounded-md border bg-surface-soft px-4 font-normal outline-none focus:ring-2 focus:ring-ring";

const Field = ({ label, error, children }) => (
  <label className="block text-sm font-bold">
    {label}
    {children}
    {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
  </label>
);

const Choice = ({ title, values, selected, onSelect, labelFor, error }) => (
  <div>
    <p className="mb-2 text-sm font-bold">{title}</p>
    <div className={`grid grid-cols-2 gap-2 ${values.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      {values.map((v) => (
        <Button
          key={v}
          variant={selected === v ? "default" : "outline"}
          onClick={() => onSelect(v)}
          aria-pressed={selected === v}
          className="h-11"
        >
          {labelFor(v)}
        </Button>
      ))}
    </div>
    {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
  </div>
);

// "List a Book" from the Lovable redesign, as a real 3-step flow.
// /sell creates a listing; /sell/:id edits one of your own.
const Sell = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["post", id],
    enabled: isEdit,
    queryFn: async () => (await apiClient.get(`/api/posts/${id}`)).data,
  });

  useEffect(() => {
    if (!existing) return;
    if (existing.user?.id !== user?.id) {
      toast.error(t("sell.notFound"));
      navigate("/profile", { replace: true });
      return;
    }
    setForm({
      bookName: existing.bookName || "",
      bookAuthor: existing.bookAuthor || "",
      bookCategory: existing.bookCategory || "",
      bookCondition: existing.bookCondition || "",
      bookDealType: normalizeDealType(existing.bookDealType),
      bookDeal: existing.bookDeal || "",
      bookDescription: existing.bookDescription || "",
      bookLocation: existing.bookLocation || "",
      pickupLat: existing.pickupLat ?? null,
      pickupLng: existing.pickupLng ?? null,
      pickupSpot: existing.pickupSpot || "",
      isPublic: existing.isPublic ?? true,
    });
    setPreview(existing.bookImage || null);
  }, [existing, user?.id, navigate, t]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (isEdit && isLoading) return <Spinner className="py-24" />;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (s) => {
    const req = t("sell.required");
    const e = {};
    if (s === 1) {
      if (!preview) e.image = t("sell.photoRequired");
      if (!form.bookName.trim()) e.bookName = req;
      if (!form.bookCategory) e.bookCategory = req;
    }
    if (s === 2) {
      if (!form.bookCondition) e.bookCondition = req;
      if (!form.bookDealType) e.bookDealType = req;
      if (form.bookDealType && form.bookDealType !== "donate" && !form.bookDeal.trim()) e.bookDeal = req;
    }
    if (s === 3 && !form.bookLocation) e.bookLocation = req;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const submit = async () => {
    const firstInvalid = [1, 2, 3].find((s) => !validate(s));
    if (firstInvalid) {
      setStep(firstInvalid);
      return;
    }
    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "bookDeal" && form.bookDealType === "donate") return body.append(key, "");
        // No pin: leave the pickup fields out so the backend clears them.
        if (value === null || (key === "pickupSpot" && !value)) return;
        body.append(key, typeof value === "string" ? value.trim() : String(value));
      });
      if (file) body.append("image", file);

      const headers = { "Content-Type": "multipart/form-data" };
      const { data } = isEdit
        ? await apiClient.put(`/api/posts/${id}`, body, { headers })
        : await apiClient.post("/api/posts", body, { headers });

      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", String(data.id)] });
      toast.success(isEdit ? t("sell.updated") : t("sell.created"));
      navigate(`/book/${data.id}`);
    } catch (error) {
      console.error("Saving listing failed:", error);
      toast.error(t("sell.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [t("sell.step1"), t("sell.step2"), t("sell.step3")];
  const previewPost = { ...form, id: 0, bookImage: preview, user };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <X /> {t("sell.cancel")}
        </Button>
        <h1 className="font-display text-xl font-bold">
          {isEdit ? t("sell.titleEdit") : t("sell.titleNew")}
        </h1>
        <span className="w-20" />
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-xs font-bold text-primary">
          <span className="uppercase">{t("sell.step", { n: step })}</span>
          <span>{stepTitles[step - 1]}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_240px]">
        <div className="space-y-6">
          {step === 1 && (
            <>
              <div>
                <h2 className="font-display text-xl font-bold">{t("sell.photo")}</h2>
                <div className="mt-3 flex gap-3">
                  {preview && (
                    <img src={preview} alt={t("sell.preview")} className="h-32 w-24 rounded-md object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`flex h-32 w-32 flex-col items-center justify-center rounded-md border border-dashed transition-colors hover:border-primary hover:text-primary ${
                      errors.image ? "border-destructive text-destructive" : ""
                    }`}
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
                      setErrors((er) => ({ ...er, image: undefined }));
                    }}
                  />
                </div>
                {errors.image && (
                  <span className="mt-1 block text-xs font-medium text-destructive">{errors.image}</span>
                )}
                <div className="mt-4 flex gap-2 rounded-md bg-trust-soft p-3 text-sm text-trust">
                  <Lightbulb className="size-4 shrink-0" /> {t("sell.tip")}
                </div>
              </div>

              <Field label={t("sell.bookTitle")} error={errors.bookName}>
                <input
                  value={form.bookName}
                  onChange={(e) => set("bookName", e.target.value)}
                  placeholder={t("sell.bookTitlePlaceholder")}
                  maxLength={200}
                  className={`${inputCls} font-display text-lg font-bold`}
                />
              </Field>
              <Field label={t("sell.author")}>
                <input
                  value={form.bookAuthor}
                  onChange={(e) => set("bookAuthor", e.target.value)}
                  placeholder={t("sell.authorPlaceholder")}
                  maxLength={200}
                  className={inputCls}
                />
              </Field>
              <Field label={t("sell.category")} error={errors.bookCategory}>
                <select
                  value={form.bookCategory}
                  onChange={(e) => set("bookCategory", e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("sell.chooseCategory")}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`categories.${c}`)}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Choice
                title={t("sell.condition")}
                values={CONDITIONS}
                selected={form.bookCondition}
                onSelect={(v) => set("bookCondition", v)}
                labelFor={(v) => t(`conditions.${v}`)}
                error={errors.bookCondition}
              />
              <Choice
                title={t("sell.dealType")}
                values={DEAL_TYPES}
                selected={form.bookDealType}
                onSelect={(v) => set("bookDealType", v)}
                labelFor={(v) => t(`deal.${v}`)}
                error={errors.bookDealType}
              />
              {form.bookDealType && form.bookDealType !== "donate" && (
                <Field
                  label={form.bookDealType === "sell" ? t("sell.price") : t("sell.swapFor")}
                  error={errors.bookDeal}
                >
                  <input
                    value={form.bookDeal}
                    onChange={(e) => set("bookDeal", e.target.value)}
                    placeholder={
                      form.bookDealType === "sell" ? t("sell.pricePlaceholder") : t("sell.swapPlaceholder")
                    }
                    maxLength={200}
                    className={inputCls}
                  />
                </Field>
              )}
              <Field label={t("sell.notes")}>
                <textarea
                  value={form.bookDescription}
                  onChange={(e) => set("bookDescription", e.target.value)}
                  placeholder={t("sell.notesPlaceholder")}
                  maxLength={2000}
                  className="mt-2 min-h-28 w-full rounded-md border bg-surface-soft p-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label={t("sell.pickup")} error={errors.bookLocation}>
                <select
                  value={form.bookLocation}
                  onChange={(e) => set("bookLocation", e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("sell.chooseCity")}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {t(`cities.${c}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <PickupPicker
                city={form.bookLocation}
                value={{ lat: form.pickupLat, lng: form.pickupLng, spot: form.pickupSpot }}
                onChange={({ lat, lng, spot }) =>
                  setForm((f) => ({ ...f, pickupLat: lat, pickupLng: lng, pickupSpot: spot || "" }))
                }
              />
              <label className="flex cursor-pointer items-center gap-3 rounded-md border p-4">
                <ShieldCheck className="shrink-0 text-trust" />
                <div>
                  <b>{t("sell.public")}</b>
                  <p className="text-xs text-muted-foreground">{t("sell.publicHint")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => set("isPublic", e.target.checked)}
                  className="ms-auto size-5 accent-primary"
                />
              </label>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button variant="outline" className="h-12" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="rtl:rotate-180" /> {t("sell.back")}
              </Button>
            )}
            {step < 3 ? (
              <Button className="h-12 flex-1" onClick={next}>
                {t("sell.next")}
              </Button>
            ) : (
              <Button className="h-12 flex-1" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <Send className="rtl:-scale-x-100" />}
                {submitting ? t("sell.publishing") : isEdit ? t("sell.saveChanges") : t("sell.publish")}
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">{t("sell.preview")}</p>
            <div className="pointer-events-none">
              <BookCard post={{ ...previewPost, bookName: form.bookName || t("sell.bookTitle") }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Sell;
