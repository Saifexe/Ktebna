import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const useBookFilters = () => {
    const [language, setLanguage] = useState("All languages");
    const [category, setCategory] = useState("All");

    const [, setSearchParams] = useSearchParams();

    useEffect(() => {
        // Carry over params we don't own (e.g. the header's ?search=) so this
        // effect doesn't wipe them when it rewrites the query string.
        setSearchParams(
            (prev) => {
                const params = new URLSearchParams();

                const search = prev.get("search");
                if (search) params.set("search", search);

                if (language !== "All languages") params.set("language", language);
                if (category !== "All") params.set("category", category);

                return params;
            },
            { replace: true },
        );
    }, [language, category, setSearchParams]);

    return {
        language,
        setLanguage,
        category,
        setCategory,

    };
};
