import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const useBookFilters = () => {
    const [language, setLanguage] = useState("All languages");
    const [category, setCategory] = useState("All");

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const params = {};
        if (language !== "All languages") params.language = language;
        if (category !== "All") params.category = category;

        setSearchParams(params);
    }, [language, category, setSearchParams]);

    return {
        language,
        setLanguage,
        category,
        setCategory,

    };
};