import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Pencil, ArrowLeft } from "lucide-react";
import UpdateProfilePictureModal from "./modal/UpdateProfilePictureModal";
import DeleteUserModal from "./modal/DeleteUserModal";
import apiClient from "../apiClient";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const UserInformations = () => {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newName, setNewName] = useState("");

  const fetchUserInformation = async () => {
    const { data } = await apiClient.get(`/api/users/${user.id}`);
    return data; // { id, name, email, profilePicture }
  };

const {
  data: userInfo,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: ["userInfo", user?.id],
  queryFn: fetchUserInformation,
  enabled: !!user?.id,
});

useEffect(() => {
  if (userInfo?.name) {
    setNewName(userInfo.name);
  }
}, [userInfo]);

if (isLoading) {
  return <p>Loading user information...</p>;
}

if (isError) {
  return <p>Failed to load user information.</p>;
}

  const handleSave = async () => {
    try {
      await apiClient.put("/api/account/name", { name: newName });

      toast.success(t("userInfo.nameUpdateSuccess"));
      setEditMode(false);
      refetch();
      refreshUser();
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error(t("userInfo.nameUpdateError"));
    }
  };

  return (
    <div className="flex flex-col md:items-center w-full md:w-full p-4 gap-3 border rounded-xl shadow-md">
      <div className="flex items-center gap-4">
        <div className="relative md:inline-block group w-16 h-16">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute bottom-0 -right-2 hover:bg-gray-100 bg-white rounded-full p-1 shadow-md transition-opacity focus:outline-none"
          >
            <Pencil size={14} color="#4B5563" />
          </button>
          <img
            src={userInfo?.profilePicture}
            alt="Profile picture"
            className="w-16 h-16 object-cover rounded-full"
          />
        </div>
        <div className="md:hidden flex flex-col">
          <h1>{userInfo?.name}</h1>
          <p>{userInfo?.email}</p>
        </div>
      </div>
      {!editMode && !settingsMode ? (
        <>
          <div className="hidden md:flex flex-col items-center">
            <h1>{userInfo?.name}</h1>
            <p>{userInfo?.email}</p>
          </div>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setSettingsMode(!settingsMode)}
              className="px-3 py-1 text-sm rounded-lg border bg-gray-100 hover:bg-gray-200 cursor-pointer"
            >
              {t("userInfo.settings")}
            </button>

            <button
              onClick={logout}
              className="px-3 py-1 text-sm rounded-lg border bg-red-500 text-white hover:bg-red-600 cursor-pointer"
            >
              {t("userInfo.logout")}
            </button>
          </div>
        </>
      ) : settingsMode ? (
        <>
          <div className="w-full">
            <button
              onClick={() => setSettingsMode(false)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 my-2 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">{t("userInfo.back")}</span>
            </button>
            <button
              onClick={() => {
                setSettingsMode(!settingsMode);
                setEditMode(!editMode);
              }}
              className="px-3 py-1 text-sm rounded-lg border bg-gray-100 hover:bg-gray-200 mb-1 mr-1"
            >
              {t("userInfo.edit")}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1 text-sm rounded-lg border bg-red-500 text-white hover:bg-red-600"
            >
              {t("userInfo.deleteAccount")}
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("userInfo.namePlaceholder")}
            className="border rounded-xl p-2"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-3 py-1 text-sm rounded-lg border bg-gray-100 hover:bg-gray-200"
            >
              {t("userInfo.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={
                newName == userInfo?.name || newName.trim()?.length === 0
              }
              className={`px-3 py-1 text-sm rounded-lg border text-white ${
                newName === userInfo?.name || newName.trim().length === 0
                  ? "bg-gray-400 "
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {t("userInfo.save")}
            </button>
          </div>
        </>
      )}
      {open && (
        <UpdateProfilePictureModal
          open={open}
          handleClose={() => {
            setOpen(false);
            refetch();
            refreshUser();
          }}
          userId={userInfo?.id}
          userProfilePicture={userInfo?.profilePicture}
        />
      )}
      {showDeleteModal && (
        <DeleteUserModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          userId={userInfo?.id}
        />
      )}
    </div>
  );
};

export default UserInformations;
