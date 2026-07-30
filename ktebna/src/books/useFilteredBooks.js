// hooks/useFilteredBooks.js
import { useMemo } from "react";

export const useFilteredBooks = (books, filters) => {
    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const languageMatch = filters.language === "All languages" || book.language === filters.language;
            const categoryMatch = filters.category === "All" || book.category === filters.category;

            return languageMatch && categoryMatch;
        });
    }, [books, filters.language, filters.category]);

    return filteredBooks;
};