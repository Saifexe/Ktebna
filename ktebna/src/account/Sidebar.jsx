import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex flex-col w-full border rounded-xl shadow-sm p-4 mt-4">
        <nav className="flex flex-col space-y-2">
          <NavLink
            to="/account/posts"
            className={({ isActive }) =>
              isActive ? "font-bold" : "text-gray-700"
            }
          >
            {t("sidebar.posts")}
          </NavLink>
          <NavLink
            to="/account/savedPosts"
            className={({ isActive }) =>
              isActive ? "font-bold" : "text-gray-700"
            }
          >
            {t("sidebar.savedPosts")}
          </NavLink>
          <NavLink
            to="/account/conversations"
            className={({ isActive }) =>
              isActive ? "font-bold" : "text-gray-700"
            }
          >
            {t("sidebar.conversations")}
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
