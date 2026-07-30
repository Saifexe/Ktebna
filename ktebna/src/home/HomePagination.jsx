import React from "react";
import { useTranslation } from "react-i18next";
const HomePagination = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex justify-center gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg border px-4 py-2 disabled:opacity-50"
      >
        {t("pagination.previous")}
      </button>

      <span className="px-4 py-2">
        {t("pagination.page")} {currentPage} / {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg border px-4 py-2 disabled:opacity-50"
      >
        {t("pagination.next")}
      </button>
    </div>
  );
};

export default HomePagination;
