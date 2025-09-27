import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define the simplified context shape
interface AuthContextType {
  isGuest: boolean;
  isLoading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the simplified provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // isLoading is kept to prevent screen flicker on initial load
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We no longer need to check Firebase, so we're ready almost instantly.
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isLoading,
      isGuest: true // Every user is now a guest
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// The custom hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};