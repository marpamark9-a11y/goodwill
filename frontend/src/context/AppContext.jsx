import React, { createContext, useEffect, useState } from 'react';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const currencySymbol = '₱';

  const fetchFacilities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/facility/list`);
      const data = await res.json();
      setFacilities(data.facilities || []);
    } catch (err) {
      console.error('Error fetching facilities from backend:', err);
    } finally {
      setLoadingFacilities(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const value = {
    facilities,
    currencySymbol,
    loadingFacilities
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
