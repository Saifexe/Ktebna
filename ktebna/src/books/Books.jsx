import React from "react";
import BooksFilterPanel from "./BooksFilterPanel";
import BooksHeader from "./BooksHeader";
import BooksList from "./BooksList";
import { booksData } from "../data/booksData";
import { useBookFilters } from "./useBookFilters";
import { useFilteredBooks } from "./useFilteredBooks";

const Books = () => {
  const { language, setLanguage, category, setCategory } = useBookFilters();
  
  const filteredBooks = useFilteredBooks(booksData, {
    language,
    category,
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">
          <BooksFilterPanel category={category} setCategory={setCategory} />
        </aside>
        <section id="catalog">
          <BooksHeader language={language} setLanguage={setLanguage} />

          <BooksList books={filteredBooks} />
        </section>
      </div>
    </div>
  );
};
export default Books;
