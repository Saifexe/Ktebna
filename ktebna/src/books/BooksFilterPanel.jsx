import CATEGORIES from "../data/categories";
import { useTranslation } from "react-i18next";

function BooksFilterPanel({ category, setCategory }) {
  const { t } = useTranslation();
  return (
    <div className="sticky top-20 space-y-6 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div>
        <h3 className="mb-2 font-display text-lg font-bold">
          {t("filterPanel.categories")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground shadow"
                  : "border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {t(`categories.${c}`)}
            </button>
          ))}
        </div>
      </div>

      {/* <div className="rounded-xl border border-amber-900/20 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
        {t("filterPanel.tip")}
      </div> */}
    </div>
  );
}

export default BooksFilterPanel;
