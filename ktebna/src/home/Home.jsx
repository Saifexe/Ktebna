// NOTE: this file was corrupted in the uploaded project archive (extracted
// as 0 bytes) and has been rebuilt from scratch, wired to match the other
// home/* components (HomeHeader, HomeFilterPanel, HomeBooks, HomePagination,
// MobileFiltersDrawer, MobileMenuDrawer) and the new Spring Boot backend.
import React, { useContext, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HomeHeader from "./HomeHeader";
import HomeFilterPanel from "./HomeFilterPanel";
import HomeBooks from "./HomeBooks";
import HomePagination from "./HomePagination";
import MobileFiltersDrawer from "./MobileFiltersDrawer";
import MobileMenuDrawer from "./MobileMenuDrawer";
import { useHomeFilters } from "./useHomeFilters";
import { usePosts } from "./usePosts";
import { usePostInteractions } from "./usePostInteractions";
import { AuthContext } from "../auth/AuthProvider";
import { MobileFiltersContext } from "../context/MobileFiltersContext";
import LoginModal from "../auth/LoginModal";
import BookDrawer from "../components/BookDrawer";
import ChatDrawer from "../chat/ChatDrawer";

const Home = () => {
  const { user } = useContext(AuthContext);
  const { mobileFiltersOpen, setMobileFiltersOpen, mobileMenuOpen, setMobileMenuOpen } =
    useContext(MobileFiltersContext);

  const { category, setCategory, dealType, setDealType, location, setLocation } =
    useHomeFilters();

  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [page, setPage] = useState(1);

  const { posts, totalPages, isLoading } = usePosts({
    category,
    dealType,
    location,
    search,
    page,
    userId: user?.id,
  });

  const {
    openLogin,
    setOpenLogin,
    selectedBook,
    openDrawer,
    openChatDrawer,
    chatDetails,
    handleOpenDrawer,
    handleCloseDrawer,
    handleOpenChatDrawer,
    handleCloseChatDrawer,
  } = usePostInteractions(user);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        category={category}
        setCategory={setCategory}
        dealType={dealType}
        setDealType={setDealType}
      />
      <MobileMenuDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">
          <HomeFilterPanel
            category={category}
            setCategory={setCategory}
            dealType={dealType}
            setDealType={setDealType}
          />
        </aside>

        <section>
          <HomeHeader location={location} setLocation={setLocation} />
          <HomeBooks
            posts={posts}
            isLoading={isLoading}
            user={user}
            setOpenLogin={setOpenLogin}
            onBookClick={handleOpenDrawer}
            onContactClick={handleOpenChatDrawer}
          />
          <HomePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </section>
      </div>

      <BookDrawer open={openDrawer} onClose={handleCloseDrawer} book={selectedBook} />

      <ChatDrawer
        open={openChatDrawer}
        onClose={handleCloseChatDrawer}
        otherUserId={chatDetails.sellerId}
        otherUserName={chatDetails.sellerName}
        userName={chatDetails.buyerName}
        bookName={chatDetails.bookName}
      />

      <LoginModal open={openLogin} onClose={() => setOpenLogin(false)} />
    </div>
  );
};

export default Home;
