import { useQuery } from "@tanstack/react-query";
import apiClient from "../apiClient";

export const useSavedPosts = (user) => {
    return useQuery({
        queryKey: ["savedPosts", user?.id],
        enabled: !!user,
        queryFn: async () => {
            const { data } = await apiClient.get("/api/saved-posts/ids");
            return data; // array of post ids
        },
    });
};
