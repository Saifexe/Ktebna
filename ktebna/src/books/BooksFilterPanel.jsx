import CATEGORIES from "../data/categories";
import { useTranslation } from "react-i18next";

function BooksFilterPanel({ category, setCategory }) {
  const { t } = useTranslation();
  return (
    <div className="sticky top-20 space-y-6 border border-stone-200/60 bg-white/70 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900/70">
      <div>
        <h3 className="mb-2 font-serif text-lg">
          {t("filterPanel.categories")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-xl px-3 py-1.5 text-sm transition ${
                category === c
                  ? "bg-amber-700 text-amber-50 shadow"
                  : "border border-stone-300 bg-white/70 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
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
