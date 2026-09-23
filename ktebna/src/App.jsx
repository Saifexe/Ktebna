import { Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import muiTheme from "./theme/muiTheme";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { MobileFiltersProvider } from "./context/MobileFiltersContext.jsx";
import { LoginPromptProvider } from "./context/LoginPromptContext.jsx";
import { NotificationsProvider } from "./context/NotificationsProvider.jsx";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Catalog from "./pages/Catalog.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import Saved from "./pages/Saved.jsx";
import Sell from "./pages/Sell.jsx";
import Messages from "./pages/Messages.jsx";
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Contact from "./pages/Contact.jsx";
import About from "./pages/About.jsx";
import LoginPage from "./auth/LoginFinal.jsx";
import Library from "./pages/Library.jsx";
import LibraryBook from "./pages/LibraryBook.jsx";
import ShareBook from "./pages/ShareBook.jsx";

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <AuthProvider>
        <LoginPromptProvider>
          <NotificationsProvider>
            <MobileFiltersProvider>
              <ToastContainer position="bottom-center" />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Catalog />} />
                  <Route path="/book/:id" element={<BookDetail />} />
                  <Route path="/books" element={<Library />} />
                  <Route path="/books/:id" element={<LibraryBook />} />
                  <Route path="/user/:id" element={<PublicProfile />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />

                  <Route element={<RequireAuth />}>
                    <Route path="/saved" element={<Saved />} />
                    <Route path="/books/new" element={<ShareBook />} />
                    <Route path="/sell" element={<Sell />} />
                    <Route path="/sell/:id" element={<Sell />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>

                  {/* Pre-redesign account URLs */}
                  <Route path="/account" element={<Navigate to="/profile" replace />} />
                  <Route path="/account/posts" element={<Navigate to="/profile" replace />} />
                  <Route path="/account/savedPosts" element={<Navigate to="/saved" replace />} />
                  <Route path="/account/conversations" element={<Navigate to="/messages" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </MobileFiltersProvider>
          </NotificationsProvider>
        </LoginPromptProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
