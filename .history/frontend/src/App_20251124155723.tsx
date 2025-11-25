// src/App.tsx
import React from 'react';
import { User } from './types';

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

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Your app routes and components go here */}
        <h1 className="p-4 text-2xl font-bold">Amazon EPTW System</h1>
      </div>
    </AppProvider>
  );
}

export default App;