import { useState, useEffect, useContext } from "react";
import UserInformations from "./UserInformations.jsx";
import Sidebar from "./Sidebar.jsx";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider.jsx";
const Account = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  return (
    <div className="mx-auto max-w-7xl px-4 mt-4 pb-4 md:mt-16 flex flex-col md:flex-row gap-4 md:gap-8">
      <div className="md:w-1/5">
        <UserInformations />
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex flex-col flex-1 md:w-4/5">
        <Outlet />
      </div>
    </div>
  );
};

export default Account;
