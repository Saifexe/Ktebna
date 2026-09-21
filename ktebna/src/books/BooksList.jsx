import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import Badge from "../ui/Badge";

// Free-to-read PDFs, laid out like the marketplace catalog tiles.
const BooksList = ({ books }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
    {books.map((book) => (
      <Link key={book.id} to={`/books/${book.name}`} className="group">
        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
          <img
            src={book.cover}
            alt={book.title}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
          <Badge tone="trust" className="absolute start-2 top-2 shadow-sm">
            PDF
          </Badge>
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug">{book.title}</h3>
        <p className="truncate text-sm text-muted-foreground">{book.author}</p>
        <p className="mt-2 flex items-center gap-1.5 font-bold text-primary">
          <BookOpen className="size-4" /> Read now
        </p>
      </Link>
    ))}
  </div>
);

export default BooksList;
