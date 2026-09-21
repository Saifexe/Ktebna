import { useTranslation } from "react-i18next";
import { useSaved } from "../hooks/useSaved";
import { MAX_SAVED } from "../lib/listing";
import SavedGrid from "../components/SavedGrid";

const Saved = () => {
  const { t } = useTranslation();
  const { count } = useSaved();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <p className="text-xs font-bold uppercase text-primary">{t("savedPage.eyebrow")}</p>
      <h1 className="font-display text-4xl font-bold">{t("savedPage.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("savedPage.subtitle", { count })}</p>
      <div className="mt-4 h-1.5 max-w-xs rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(count / MAX_SAVED, 1) * 100}%` }}
        />
      </div>
      <div className="mt-8">
        <SavedGrid />
      </div>
    </div>
  );
};

export default Saved;
