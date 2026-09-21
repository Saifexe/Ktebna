import React from "react";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center px-6 py-10 ">
      <div className="w-full max-w-3xl rounded-lg border border-border bg-card p-8 shadow-sm md:px-10 md:py-4">
        <h1 className="mb-4 text-center font-display text-2xl font-bold text-foreground">
          {t("contact.title")}{" "}
          <span className="text-primary">{t("contact.ktebna")}</span>
        </h1>

        <p className="mb-4 text-center text-muted-foreground">
          {t("contact.subtitle")}
        </p>

        {/* <form className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t("contact.messageLabel")}
            </label>
            <textarea
              rows="3"
              placeholder={t("contact.messagePlaceholder")}
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            {t("contact.sendButton")}
          </button>
        </form> */}

        <div className="mb-4 text-center text-foreground">
          {t("contact.reachUs")}{" "}
          <span className="font-medium text-primary">
            ktebna.tunisie@gmail.com
          </span>
        </div>
      </div>
    </div>
  );
};

export default Contact;
