// NOTE: this file was corrupted in the uploaded project archive (extracted
// as 0 bytes) and has been rebuilt from scratch based on how Home.jsx,
// HomeBooks.jsx and useHomeFilters.js consume it. It now talks to the
// Spring Boot backend instead of Supabase.
import { useEffect, useState } from "react";
import apiClient from "../apiClient";

const PAGE_SIZE = 12;

export const usePosts = ({ category, dealType, location, search, page, userId }) => {
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const params = {
          page: Math.max(page - 1, 0), // backend pages are 0-indexed
          size: PAGE_SIZE,
        };
        if (category && category !== "All") params.category = category;
        if (dealType && dealType !== "All") params.dealType = dealType;
        if (location && location !== "allTunisia") params.location = location;

        const { data } = await apiClient.get("/api/posts", { params });

        let results = data.data || [];

        // Client-side search filter on the current page (search wasn't part
        // of the original backend query surface we recovered).
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          results = results.filter((p) =>
            p.bookName?.toLowerCase().includes(q),
          );
        }

        // Mark saved posts for the logged-in user.
        if (userId) {
          try {
            const { data: savedIds } = await apiClient.get(
              "/api/saved-posts/ids",
            );
            const savedSet = new Set(savedIds);
            results = results.map((p) => ({ ...p, isSaved: savedSet.has(p.id) }));
          } catch {
            // Non-fatal: just show posts without the saved indicator.
          }
        }

        if (!cancelled) {
          setPosts(results);
          setTotalPages(data.totalPages ?? 1);
          setCount(data.count ?? results.length);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        if (!cancelled) {
          setPosts([]);
          setTotalPages(1);
          setCount(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPosts();
    return () => {
      cancelled = true;
    };
  }, [category, dealType, location, search, page, userId]);

  return { posts, totalPages, count, isLoading };
};

export default usePosts;
