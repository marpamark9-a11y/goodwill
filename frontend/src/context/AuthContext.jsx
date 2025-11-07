import React, { createContext, useState, useEffect } from 'react';

// Create AuthContext
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  // Load from localStorage immediately on init
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('jwtToken') || null;
  });

  const [loadingAuth, setLoadingAuth] = useState(true); // Optional flag

  useEffect(() => {
    // Extra fallback check in case storage is updated manually
    const storedUser = localStorage.getItem('loggedInUser');
    const storedToken = localStorage.getItem('jwtToken');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setLoadingAuth(false);
  }, []);

  // Login Handler
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('loggedInUser', JSON.stringify(userData));
    if (authToken) {
      localStorage.setItem('jwtToken', authToken);
    } else {
      localStorage.removeItem('jwtToken');
    }
  };

  // Logout Handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('jwtToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
