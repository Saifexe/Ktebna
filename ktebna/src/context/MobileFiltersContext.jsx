import React, { useState, createContext } from "react";

const MobileFiltersContext = createContext();

const MobileFiltersProvider = ({ children }) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <MobileFiltersContext.Provider
      value={{
        mobileFiltersOpen,
        setMobileFiltersOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </MobileFiltersContext.Provider>
  );
};

export { MobileFiltersProvider, MobileFiltersContext };
