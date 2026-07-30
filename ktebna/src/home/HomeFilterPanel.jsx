// NOTE: this file was corrupted in the uploaded project archive (extracted
// as 0 bytes) and has been rebuilt based on how MobileFiltersDrawer.jsx and
// Home.jsx consume it (category/setCategory, dealType/setDealType props).
import React from "react";
import CATEGORIES from "../data/categories";
import { useTranslation } from "react-i18next";

const DEAL_TYPES = ["All", "sell", "exchange", "donate"];

const HomeFilterPanel = ({ category, setCategory, dealType, setDealType }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
          {t("filterPanel.categories")}
        </h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setCategory("All")}
            className={`rounded-xl px-3 py-2 text-left text-sm transition ${
              category === "All"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : "hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            {t("filterPanel.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                category === c
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {t(`categories.${c}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
          {t("filterPanel.dealType")}
        </h3>
        <div className="flex flex-col gap-1">
          {DEAL_TYPES.map((d) => (
            <button
              key={d}
              onClick={() => setDealType(d)}
              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                dealType === d
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {t(`filterPanel.${d === "All" ? "all" : d}`)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400">
        {t("filterPanel.tip")}
      </p>
    </div>
  );
};

export default HomeFilterPanel;
