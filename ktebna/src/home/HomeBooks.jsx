import { motion, AnimatePresence } from "framer-motion";
import CircularProgress from "@mui/material/CircularProgress";
import HomeBook from "./HomeBook";
import { useTranslation } from "react-i18next";
const HomeBooks = ({
  posts,
  isLoading,
  user,
  setOpenLogin,
  onBookClick,
  onContactClick,
}) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence mode="popLayout">
      {isLoading ? (
        <motion.div className="flex justify-center p-8">
          <CircularProgress />
        </motion.div>
      ) : posts?.length === 0 ? (
        <motion.div className="rounded-2xl border p-8 text-center">
          {t("home.noBooks")}
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((b) => (
            <HomeBook
              key={b.id}
              book={b}
              isSaved={b.isSaved}
              userId={user?.id}
              setOpenLogin={setOpenLogin}
              onClick={() => onBookClick(b)}
              handleOpenContactDrawer={() => onContactClick(b)}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HomeBooks;
