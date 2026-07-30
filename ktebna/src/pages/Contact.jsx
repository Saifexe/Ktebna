import React from "react";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center px-6 py-10 ">
      <div className="max-w-3xl w-full bg-white/70 border border-stone-200/60 shadow-sm p-8 md:px-10 md:py-4">
        <h1 className="text-2xl md:text-2xl font-serif text-gray-900 mb-4 text-center">
          {t("contact.title")}{" "}
          <span className="text-amber-600">{t("contact.ktebna")}</span>
        </h1>

        <p className="text-gray-600 text-center mb-4">
          {t("contact.subtitle")}
        </p>

        {/* <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("contact.messageLabel")}
            </label>
            <textarea
              rows="3"
              placeholder={t("contact.messagePlaceholder")}
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 shadow-md transition"
          >
            {t("contact.sendButton")}
          </button>
        </form> */}

        <div className="mb-4 text-center text-gray-900">
          {t("contact.reachUs")}{" "}
          <span className="font-medium text-amber-600">
            ktebna.tunisie@gmail.com
          </span>
        </div>
      </div>
    </div>
  );
};

export default Contact;
