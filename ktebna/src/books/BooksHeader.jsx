import React from "react";
import { Filter } from "lucide-react";
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
      <h2 className="font-display text-2xl font-bold">
        {/* {t("home.recentBooks")} */}
        {t("booksHeader.title")}
      </h2>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground md:hidden" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm outline-none"
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
