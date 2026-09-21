import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

const Pagination = ({ page, totalPages, onChange }) => {
  const { t } = useTranslation();
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="rtl:rotate-180" />
        {t("pagination.previous")}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t("pagination.page")} {page} / {totalPages}
      </span>
      <Button variant="outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {t("pagination.next")}
        <ChevronRight className="rtl:rotate-180" />
      </Button>
    </nav>
  );
};

export default Pagination;
