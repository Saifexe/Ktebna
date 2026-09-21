import { useState } from "react";
import { BookOpen } from "lucide-react";

// Cover image with a paper-toned placeholder when a post has no (or a broken) image.
const BookCover = ({ src, alt, className = "", imgClassName = "object-cover" }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br from-accent to-surface-soft text-primary/60 ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="size-1/3 max-h-16 max-w-16" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${imgClassName} ${className}`}
    />
  );
};

export default BookCover;
