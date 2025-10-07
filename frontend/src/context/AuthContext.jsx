import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  loginUser: () => {},
});

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/profile`, {
          withCredentials: true, 
        });
        setIsAuthenticated(true);
        setUser(res.data.user);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
  const loginUser = () => {
    setIsAuthenticated(true);
  };
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, setIsAuthenticated, loginUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
