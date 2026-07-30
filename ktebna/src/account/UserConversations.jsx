import { useState, useContext } from "react";
import { AuthContext } from "../auth/AuthProvider.jsx";
import { getMyConversations } from "../chat/chatService.js";
import { useQuery } from "@tanstack/react-query";
import ChatDrawer from "../chat/ChatDrawer.jsx";
import { useTranslation } from "react-i18next";

const UserConversations = () => {
  const { t } = useTranslation();
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [open, setOpen] = useState(false);
  const { user } = useContext(AuthContext);

  const {
    data: conversations,
    isLoading,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: getMyConversations,
    enabled: !!user?.id,
  });

  return (
    <div className="border flex flex-col flex-1 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">
        {t("conversations.title")}{" "}
        <span className="text-gray-600 text-base font-normal">
          ({t("conversations.note")})
        </span>
      </h2>
      <hr />
      {isLoading ? (
        <p className="text-gray-500 italic text-center py-4">
          {t("conversations.loading")}
        </p>
      ) : conversations?.length === 0 ? (
        <p className="text-gray-500 italic text-center py-4">
          {t("conversations.noConversations")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-4">
          {conversations?.map((conv) => {
            const otherUser =
              conv.firstUser?.id === user?.id ? conv.secondUser : conv.firstUser;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedSeller(otherUser.id);
                  setSelectedName(otherUser.name);
                  setOpen(true);
                }}
                className="flex items-center justify-between p-4 border border-gray-300 bg-white/40 shadow hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      otherUser.profilePicture ||
                      "https://via.placeholder.com/40"
                    }
                    alt={otherUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium truncate max-w-40">
                      {otherUser.name} ({conv.conversationTopic})
                    </p>
                    <p className="text-sm text-gray-500 truncate max-w-40">
                      {conv.lastMessageSender === user?.id
                        ? `${t("conversations.you")}: `
                        : `${otherUser.name}: `}
                      {conv.lastMessageContent}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {conv.updatedAt
                    ? new Date(conv.updatedAt).toLocaleDateString()
                    : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {open && (
        <ChatDrawer
          open={open}
          onClose={() => {
            setSelectedSeller(null);
            setOpen(false);
          }}
          otherUserId={selectedSeller}
          otherUserName={selectedName}
          userName={user?.name}
        />
      )}
    </div>
  );
};

export default UserConversations;
