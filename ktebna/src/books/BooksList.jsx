import React from "react";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BooksList = ({ books }) => {
  const navigate = useNavigate();

  const handleBookSelect = (book) => {
    navigate(`/books/${book.name}`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {books.map((book) => (
        <motion.div
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          key={book.id}
          className="rounded-b-2xl border border-stone-200/60 bg-stone-50 shadow-sm transition hover:shadow-lg dark:border-stone-800/60 dark:bg-stone-900 cursor-pointer"
          onClick={() => handleBookSelect(book)}
        >
          <div className="relative">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full aspect-3/4 object-cover px-1 pt-1"
            />
          </div>
          <div className="px-3 py-3">
            <h3 className="text-lg font-semibold text-gray-800 truncate">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 truncate">{book.author}</p>
            <div className="flex items-center justify-center gap-2 text-amber-600 font-medium">
              <BookOpen className="w-4 h-4" />
              <span>Read Now</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BooksList;
