import React from "react";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
const BookDrawer = ({ open, onClose, book }) => {
  const { t } = useTranslation();
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        className: "rounded-t-2xl p-6 bg-white dark:bg-stone-900",
      }}
    >
      {book && (
        <div>
          <div className="flex justify-between items-start">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
              <img
                src={book.bookImage}
                alt={book.bookName}
                className="w-1/2 md:w-full aspect-3/4 rounded-xl object-cover"
              />
              <div className="md:flex flex-col justify-between h-full">
                <div>
                  <p className="text-sm text-gray-700">
                    {t("BookDrawer.userHave")}{" "}
                    <span className="text-amber-700">
                      {t("BookDrawer.have")}
                    </span>
                    :{" "}
                    <span className="text-stone-900 font-serif text-base">
                      {book.bookName}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("BookDrawer.userWant")}{" "}
                    <span className="text-amber-700">
                      {t("BookDrawer.want")}
                    </span>
                    :{" "}
                    <span className="text-stone-900 font-serif text-base">
                      {book.bookDeal}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("BookDrawer.userIs")}{" "}
                    <span className="text-amber-700">{t("BookDrawer.is")}</span>
                    :{" "}
                    <span className="text-stone-900 font-serif text-base">
                      {book.user?.name || t("BookDrawer.you") + " "}
                    </span>
                    <span className="text-amber-700 text-sm">
                      {t("BookDrawer.from")}:{" "}
                    </span>
                    <span className="text-stone-900 font-serif text-base">
                      {book.bookLocation}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    {t("BookDrawer.category")}:{" "}
                    <span className="text-stone-900 font-serif text-base">
                      {t(`categories.${book.bookCategory}`)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("BookDrawer.dealType")}:{" "}
                    <span className="text-stone-900 font-serif text-base">
                      {t(`filterPanel.${book.bookDealType}`)}
                    </span>
                  </p>
                </div>
                {/* <p className="font-medium">
                  {t("BookDrawer.location")}: {book.book_location}
                </p> */}
              </div>
            </div>
            <IconButton onClick={onClose}>
              <X className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default BookDrawer;
