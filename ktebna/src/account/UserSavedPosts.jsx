import React, { useState, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import ChatDrawer from "../chat/ChatDrawer";
import { useTranslation } from "react-i18next";
import BookDrawer from "../components/BookDrawer";
import { usePostInteractions } from "../home/usePostInteractions";
import HomePagination from "../home/HomePagination";

const PAGE_SIZE = 12;

const UserSavedPosts = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [savingPostId, setSavingPostId] = useState(null);
  const { user } = useContext(AuthContext);

  const queryKey = ["savedPosts", user?.id, page];

  const fetchSavedPosts = async () => {
    const { data } = await apiClient.get("/api/saved-posts", {
      params: { page: page - 1, size: PAGE_SIZE },
    });
    return data; // { data, count, totalPages }
  };

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: fetchSavedPosts,
    enabled: !!user?.id,
    keepPreviousData: true,
  });
  const savedPosts = data?.data || [];
  const totalPages = data?.totalPages ?? 0;

  const toggleSaveMutation = useMutation({
    mutationFn: async (post) => {
      setSavingPostId(post.id);
      await apiClient.delete(`/api/saved-posts/${post.id}`);
      return post.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts", user?.id] });
    },
    onSettled: () => {
      setSavingPostId(null);
    },
  });

  const {
    openDrawer,
    handleCloseDrawer,
    handleOpenDrawer,
    selectedBook,
    openChatDrawer,
    chatDetails,
    handleOpenChatDrawer,
    handleCloseChatDrawer,
  } = usePostInteractions(user);

  return (
    <div className="border flex flex-col flex-1 rounded-xl shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">
        {t("savedPosts.title")}{" "}
        <span className="text-gray-600 text-base font-normal">
          ({t("savedPosts.note")})
        </span>
      </h2>
      <hr />

      {isLoading ? (
        <p className="text-gray-500 italic text-center py-4">
          {t("savedPosts.loading")}
        </p>
      ) : savedPosts?.length === 0 ? (
        <p className="text-gray-500 italic text-center py-4">
          {t("savedPosts.noPosts")}
        </p>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            {savedPosts?.map((post) => (
              <div
                key={post.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDrawer(post);
                }}
              >
                <img
                  src={post.bookImage}
                  alt={post.bookName}
                  className="w-32 aspect-3/4 object-cover"
                />
                <h3 className="font-medium truncate">{post.bookName}</h3>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveMutation.mutate(post);
                    }}
                    disabled={savingPostId === post.id}
                    className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    {savingPostId === post.id
                      ? t("savedPosts.unsaving")
                      : t("savedPosts.unsave")}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenChatDrawer(post);
                    }}
                    className="text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700 disabled:opacity-50"
                  >
                    {t("savedPosts.contact")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <HomePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
      <BookDrawer open={openDrawer} onClose={handleCloseDrawer} book={selectedBook} />
      {openChatDrawer && (
        <ChatDrawer
          open={openChatDrawer}
          onClose={handleCloseChatDrawer}
          otherUserId={chatDetails.sellerId}
          otherUserName={chatDetails.sellerName}
          userName={chatDetails.buyerName}
          bookName={chatDetails.bookName}
        />
      )}
    </div>
  );
};

export default UserSavedPosts;
