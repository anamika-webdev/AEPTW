import React, { useState } from 'react';
import { User } from './types';
import LoginPage from './pages/auth/LoginPage';

// App Context
export interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Main App Component
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    console.log('User logged in:', user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {!currentUser ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
              <h1 className="mb-6 text-2xl font-bold text-center">
                Welcome to Amazon EPTW
              </h1>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50">
                  <p className="text-sm text-gray-600">Logged in as:</p>
                  <p className="font-semibold">{currentUser.full_name}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                  <p className="text-sm text-gray-500">Role: {currentUser.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}

export default App;