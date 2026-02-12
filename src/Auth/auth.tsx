// auth.jsx
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any;
  login: (userData: any, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: {children: any}) => {
  const [user, setUser] = useState(null);

  // Function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If token is malformed, consider it expired
    }
  };

  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Check if both user and token exist, and token is not expired
    if (userInfo && token && !isTokenExpired(token)) {
      setUser(JSON.parse(userInfo));
    } else {
      // Clear invalid/expired data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setUser(null);
    }
  }, [])

  const login = (userData: any, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
