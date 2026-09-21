import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { booksData } from "../data/booksData"; // Import the books data

const Book = () => {
  const { name } = useParams(); // Get the book name from URL
  const navigate = useNavigate();

  // Find the book by name
  const selectedBook = booksData.find((book) => book.name === name);

  // Handle case where book is not found
  if (!selectedBook) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
            Book not found
          </h2>
          <button
            onClick={() => navigate("/books")}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="p-0">
        <div className="max-full">
          <iframe
            src={selectedBook.pdfUrl}
            className="h-screen w-full bg-card"
            title={selectedBook.title}
          />
        </div>
      </div>
    </div>
  );
};

export default Book;
