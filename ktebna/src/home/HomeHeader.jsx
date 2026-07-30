import React from "react";
import { Filter } from "lucide-react";
import cities from "../data/cities";
import { useTranslation } from "react-i18next";

const HomeHeader = ({ location, setLocation }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
        {t("home.recentBooks")}
      </h2>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-stone-500 md:hidden" />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white/80 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
        >
          <option value="allTunisia">{t("cities.allTunisia")}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {t(`cities.${city}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default HomeHeader;
