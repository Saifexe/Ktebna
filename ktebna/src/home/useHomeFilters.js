import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const useHomeFilters = () => {
    const [category, setCategory] = useState("All");
    const [dealType, setDealType] = useState("All");
    const [location, setLocation] = useState("allTunisia");

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const params = {};
        if (dealType !== "All") params.dealType = dealType;
        if (location !== "allTunisia") params.location = location;
        if (category !== "All") params.category = category;

        setSearchParams(params);
    }, [dealType, location, category]);

    return {
        category,
        setCategory,
        dealType,
        setDealType,
        location,
        setLocation,
    };
};
