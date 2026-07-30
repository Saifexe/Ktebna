import React from "react";
import { Filter } from "lucide-react";
import cities from "../data/cities";
import { useTranslation } from "react-i18next";

const BooksHeader = ({ language, setLanguage }) => {
  const { t } = useTranslation();

  const bookLanguages = [
    { value: "All languages", label: t("booksHeader.allLanguages") },
    { value: "Anglais", label: t("booksHeader.english") },
    { value: "Francais", label: t("booksHeader.french") },
    { value: "Arabic", label: t("booksHeader.arabic") },
  ];
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
        {/* {t("home.recentBooks")} */}
        {t("booksHeader.title")}
      </h2>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-stone-500 md:hidden" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white/80 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
        >
          {bookLanguages.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BooksHeader;
