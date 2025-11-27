import React, { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      setCurrentUser(JSON.parse(localStorage.getItem('user')));
    } catch (e) {
      setCurrentUser(null);
    }
    const onStorage = (e) => {
      if (e.key === 'user') {
        try { setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null); } catch { setCurrentUser(null); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = (user) => {
    try { localStorage.setItem('user', JSON.stringify(user)); } catch (e) {}
    setCurrentUser(user);
  };

  const logout = async () => {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
    try { localStorage.removeItem('user'); } catch (e) {}
    setCurrentUser(null);
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export default UserContext;
