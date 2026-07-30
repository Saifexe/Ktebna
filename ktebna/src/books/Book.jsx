import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { booksData } from "../data/booksData"; // Import the books data

const Book = () => {
  const { name } = useParams(); // Get the book name from URL
  const navigate = useNavigate();

  // Find the book by name
  const selectedBook = booksData.find((book) => book.name === name);

  // Handle case where book is not found
  if (!selectedBook) {
    return (
      <div className="bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.08),transparent_50%),linear-gradient(to_bottom,#faf7f2,#f7f3ea)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Book not found
          </h2>
          <button
            onClick={() => navigate("/books")}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.08),transparent_50%),linear-gradient(to_bottom,#faf7f2,#f7f3ea)] mt-0">
      <div className="p-0">
        <div className="max-full">
          <iframe
            src={selectedBook.pdfUrl}
            className="w-full h-screen bg-white"
            title={selectedBook.title}
          />
        </div>
      </div>
    </div>
  );
};

export default Book;
