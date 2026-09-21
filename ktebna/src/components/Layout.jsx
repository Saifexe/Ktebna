import { useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import MobileMenuDrawer from "./MobileMenuDrawer";
import { MobileFiltersContext } from "../context/MobileFiltersContext";

function Layout() {
  const { mobileMenuOpen, setMobileMenuOpen } = useContext(MobileFiltersContext);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      {/* pb-24 clears the fixed mobile bottom nav */}
      <main className="flex-1 pb-24 md:pb-10">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <MobileMenuDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  );
}

export default Layout;
