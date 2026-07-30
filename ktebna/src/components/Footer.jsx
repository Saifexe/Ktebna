import React from "react";
import CATEGORIES from "../data/categories";
import { BookOpen } from "lucide-react";
const Footer = () => {
  return (
    <footer className="border-t border-stone-200/70 bg-white/60 py-10 text-sm dark:border-stone-800 dark:bg-stone-900/60">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-700" />
            <span className="font-serif text-lg">The Bookshop</span>
          </div>
          <p className="mt-2 max-w-xs text-stone-600 dark:text-stone-400">
            Inspired by timeless libraries. Thoughtfully curated books for every
            shelf.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:col-span-2 md:grid-cols-4">
          <div>
            <h4 className="mb-2 font-semibold">Shop</h4>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              <li>New Arrivals</li>
              <li>Bestsellers</li>
              <li>Gift Cards</li>
              <li>Membership</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Genres</h4>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Support</h4>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              <li>Help Center</li>
              <li>Shipping</li>
              <li>Returns</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Legal</h4>
            <ul className="space-y-2 text-stone-600 dark:text-stone-400">
              <li>Terms</li>
              <li>Privacy</li>
              <li>Cookies</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-8 text-stone-500">
        © {new Date().getFullYear()} The Bookshop
      </div>
    </footer>
  );
};

export default Footer;
