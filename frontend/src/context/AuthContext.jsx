import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Validate token on mount / token change
  useEffect(() => {
    if (!token) {
      localStorage.removeItem('token');
      setUser(null);
      return;
    }

    localStorage.setItem('token', token);
    fetch('http://localhost:8000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => setUser(data))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/login');
      });
  }, [token]);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.access_token);
      navigate('/');
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (email, password) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      return login(email, password);
    } catch {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
