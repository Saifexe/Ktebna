import { useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import { useRequireAuth } from "./useRequireAuth";

// Saved ("bookmarked") posts. One cached id list drives every heart icon in
// the app, and toggling invalidates the Saved page list too.
export const useSaved = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const idsKey = ["savedIds", user?.id];

  const { data: ids = [] } = useQuery({
    queryKey: idsKey,
    enabled: !!user,
    queryFn: async () => (await apiClient.get("/api/saved-posts/ids")).data,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, saved }) => {
      if (saved) await apiClient.delete(`/api/saved-posts/${id}`);
      else await apiClient.post(`/api/saved-posts/${id}`);
    },
    onMutate: async ({ id, saved }) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previous = queryClient.getQueryData(idsKey);
      queryClient.setQueryData(idsKey, (old = []) =>
        saved ? old.filter((x) => x !== id) : [...old, id],
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(idsKey, context?.previous);
      toast.error(
        err?.response?.status === 400 ? t("savedPage.maxReached") : t("sell.error"),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["savedIds"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });

  const isSaved = (id) => ids.includes(id);

  const toggle = (id) =>
    requireAuth(() => mutation.mutate({ id, saved: isSaved(id) }));

  return { ids, isSaved, toggle, count: ids.length };
};
