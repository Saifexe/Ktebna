import React from "react";
import BooksFilterPanel from "./BooksFilterPanel";
import BooksHeader from "./BooksHeader";
import BooksList from "./BooksList";
import { booksData } from "../data/booksData";
import { useBookFilters } from "./useBookFilters";
import { useFilteredBooks } from "./useFilteredBooks";
import { useTranslation } from "react-i18next";
const Books = () => {
  const { language, setLanguage, category, setCategory } = useBookFilters();
  const { t } = useTranslation();

  const filteredBooks = useFilteredBooks(booksData, {
    language,
    category,
  });
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 mt-6">
      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <aside className="hidden md:block">
          <BooksFilterPanel category={category} setCategory={setCategory} />
        </aside>
        <section id="catalog">
          <BooksHeader language={language} setLanguage={setLanguage} />
          {/* <BooksList books={filteredBooks} /> */}
          <div className="rounded-2xl border p-8 text-center">
            {t("home.noBooks")}
          </div>
        </section>
      </div>
    </div>
  );
};
export default Books;
