import React, { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import AddPostModal from "./modal/AddPostModal";
import UpdatePostModal from "./modal/UpdatePostModal";
import DeletePostModal from "./modal/DeletePostModal";
import { AuthContext } from "../auth/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { Plus } from "lucide-react";
import { usePostInteractions } from "../home/usePostInteractions";
import BookDrawer from "../components/BookDrawer";
import HomePagination from "../home/HomePagination";

const PAGE_SIZE = 12;

const UserPosts = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const queryKey = ["userPosts", page];

  const fetchPosts = async () => {
    const { data } = await apiClient.get("/api/posts/me", {
      params: { page: page - 1, size: PAGE_SIZE },
    });
    return data; // { data, count, totalPages }
  };

  const { data: posts, isLoading } = useQuery({
    queryKey,
    queryFn: fetchPosts,
    enabled: !!user?.id,
    keepPreviousData: true,
  });

  const totalPages = posts?.totalPages ?? 0;

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isPublic }) => {
      await apiClient.patch(`/api/posts/${id}/visibility`, { isPublic });
    },
    onMutate: async ({ id, isPublic }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        data: old.data.map((post) =>
          post.id === id ? { ...post, isPublic } : post,
        ),
      }));

      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (post) => {
      await apiClient.delete(`/api/posts/${post.id}`);
      return post.id;
    },
    onMutate: async (deletedPost) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
        old
          ? { ...old, data: old.data.filter((p) => p.id !== deletedPost.id) }
          : old,
      );

      return { previous };
    },
    onError: (_err, _deletedPost, context) => {
      queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });

  // AddPostModal performs the actual POST itself (multipart image upload);
  // here we just fold the created post into the cache.
  const handlePostAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["userPosts"] });
  };

  const handleOpenUpdate = (post) => {
    setSelectedPost(post);
    setShowUpdateModal(true);
  };
  const handleOpenDelete = (post) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };
  const { openDrawer, handleCloseDrawer, handleOpenDrawer, selectedBook } =
    usePostInteractions();

  return (
    <div className="relative border flex flex-col flex-1 rounded-xl shadow-md p-4">
      <button
        className="absolute right-3 rounded-xl bg-amber-700 px-3 py-1 text-sm font-medium text-amber-50 shadow hover:bg-amber-800 active:scale-[0.98] h-fit w-fit"
        onClick={() => setShowAddModal(true)}
      >
        <Plus className="w-5 h-5 sm:hidden" />
        <span className="hidden sm:inline">{t("userPosts.addPost")}</span>
      </button>
      <h2 className="text-lg font-semibold mb-4">{t("userPosts.yourPosts")}</h2>
      <hr />

      {isLoading ? (
        <p className="text-gray-500 italic text-center py-4">
          {t("userPosts.loading")}
        </p>
      ) : posts?.data?.length === 0 ? (
        <p className="text-gray-500 italic text-center py-4">
          {t("userPosts.noPosts")}
        </p>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            {posts?.data?.map((post) => (
              <div
                key={post.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDrawer(post);
                }}
              >
                <div className="relative w-32">
                  <img
                    src={post.bookImage}
                    alt={post.bookName}
                    className="w-32 aspect-3/4 object-cover"
                  />
                  <span
                    className={`absolute top-1 right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5
                      ${
                        post.isPublic
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {post.isPublic
                      ? t("userPosts.public", "Public")
                      : t("userPosts.private", "Private")}
                  </span>
                </div>
                <h3 className="font-medium truncate">{post.bookName}</h3>
                <div className="flex flex-wrap gap-2 mt-2 ">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibilityMutation.mutate({
                        id: post.id,
                        isPublic: !post.isPublic,
                      });
                    }}
                    className={`text-xs px-2 py-1 rounded flex items-center gap-1
                      ${
                        post.isPublic
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                  >
                    {post.isPublic
                      ? t("userPosts.makePrivate", "Make Private")
                      : t("userPosts.makePublic", "Make Public")}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenUpdate(post);
                    }}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    {t("userPosts.edit")}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDelete(post);
                    }}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    {t("userPosts.delete")}
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
      <AddPostModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={user?.id}
        onAdd={handlePostAdded}
      />
      {selectedPost && (
        <UpdatePostModal
          open={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedPost(null);
            queryClient.invalidateQueries({ queryKey: ["userPosts"] });
          }}
          post={selectedPost}
        />
      )}
      {selectedPost && (
        <DeletePostModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onDelete={deleteMutation.mutate}
        />
      )}
    </div>
  );
};

export default UserPosts;
