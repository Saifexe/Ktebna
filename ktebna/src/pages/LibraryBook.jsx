import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { BookOpen, BookX, ExternalLink, Trash2 } from "lucide-react";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import BookCover from "../components/BookCover";
import { timeAgo } from "../lib/listing";

// One book of the free Library. The PDF opens in a new tab: most hosts refuse
// to be framed, and our CSP blocks third-party frames anyway.
const LibraryBook = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const { data: book, isLoading, isError } = useQuery({
    queryKey: ["libraryBook", id],
    queryFn: async () => (await apiClient.get(`/api/library/${id}`)).data,
    retry: false,
  });

  if (isLoading) return <Spinner className="py-24" />;

  if (isError || !book) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={BookX}
          title={t("library.notFound")}
          action={<Button to="/books">{t("library.back")}</Button>}
        />
      </div>
    );
  }

  const isSharer = user?.id === book.user?.id;

  const remove = async () => {
    setRemoving(true);
    try {
      await apiClient.delete(`/api/library/${book.id}`);
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(t("library.removed"));
      navigate("/books", { replace: true });
    } catch {
      toast.error(t("library.error"));
      setRemoving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 lg:px-6">
      <p className="mb-4 truncate text-xs text-muted-foreground">
        <Link to="/books" className="hover:text-primary">
          {t("nav.library")}
        </Link>
        {" / "}
        <b className="text-foreground">{book.title}</b>
      </p>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_3fr]">
        <div className="overflow-hidden rounded-lg border bg-surface-soft p-5">
          <BookCover
            src={book.coverImage}
            alt={book.title}
            className="mx-auto aspect-[3/4] max-h-[560px] w-full"
            imgClassName="object-contain"
          />
        </div>

        <div className="md:pt-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="trust">PDF</Badge>
            <Badge>{t(`library.languages.${book.language}`, book.language)}</Badge>
            {book.category && <Badge>{t(`categories.${book.category}`, book.category)}</Badge>}
          </div>
          <h1 dir="auto" className="mt-3 font-display text-4xl font-bold leading-tight">{book.title}</h1>
          {book.author && (
            <p className="mt-4">
              {t("book.by")} <b>{book.author}</b>
            </p>
          )}

          <div className="mt-6 rounded-lg border bg-surface-soft p-6">
            <Button
              size="lg"
              className="w-full"
              onClick={() => window.open(book.pdfUrl, "_blank", "noopener,noreferrer")}
            >
              <BookOpen /> {t("library.read")} <ExternalLink />
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">{t("library.externalNote")}</p>
          </div>

          {book.description && (
            <p dir="auto" className="mt-6 whitespace-pre-line text-muted-foreground">{book.description}</p>
          )}

          <div className="mt-6 flex items-center gap-4 rounded-lg border p-4">
            <Avatar src={book.user?.profilePicture} name={book.user?.name} className="size-12" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("library.sharedBy")}</p>
              <b className="block truncate">{book.user?.name}</b>
              <p className="text-xs text-muted-foreground">{timeAgo(book.createdAt, i18n.language)}</p>
            </div>
            {isSharer && (
              <div className="ms-auto flex gap-2">
                {confirming && (
                  <Button variant="ghost" onClick={() => setConfirming(false)} disabled={removing}>
                    {t("library.cancel")}
                  </Button>
                )}
                <Button
                  variant={confirming ? "destructive" : "outline"}
                  onClick={confirming ? remove : () => setConfirming(true)}
                  disabled={removing}
                >
                  <Trash2 /> {confirming ? t("library.confirmRemove") : t("library.remove")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryBook;
