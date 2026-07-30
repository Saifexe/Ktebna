import { createContext, useState, useContext } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { MobileFiltersContext } from "../context/MobileFiltersContext";
import MobileMenuDrawer from "../home/MobileMenuDrawer";

function Layout() {
  const {
    mobileMenuOpen,
    setMobileMenuOpen,
    mobileFiltersOpen,
    setMobileFiltersOpen,
  } = useContext(MobileFiltersContext);
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.08),transparent_50%),linear-gradient(to_bottom,#faf7f2,#f7f3ea)] text-stone-800 dark:bg-[linear-gradient(to_bottom,#0b0a09,#0d0c0a)] dark:text-stone-200">
      <Header />
      <main>
        <Outlet />
      </main>
      <MobileMenuDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
export default Layout;
