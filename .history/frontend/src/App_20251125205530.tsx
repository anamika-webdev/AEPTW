// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteManagement from './pages/admin/SiteManagement';
import UserManagement from './pages/admin/UserManagement';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import UserProfile from './components/common/UserProfile';

// User interface
interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
  created_at?: string;
}

// Page types
type PageType = 
  | 'dashboard' 
  | 'site-management' 
  | 'user-management' 
  | 'all-permits'
  | 'create-ptw'
  | 'worker-list';

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

// App Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AppContext.Provider>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        handleLogout();
      }
    }
  }, []);

  // Handle login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
    setShowProfile(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    sessionStorage.clear();
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setShowProfile(false);
  };

  // Handle navigation
  const handleNavigate = (page: string) => {
    console.log('🚀 Navigating to:', page);
    setCurrentPage(page as PageType);
    setShowProfile(false);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  // If not logged in, show auth pages
  if (!currentUser) {
    return (
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    );
  }

  // Determine frontend role
  const getFrontendRole = (dbRole: string): 'admin' | 'supervisor' => {
    if (dbRole === 'Admin') return 'admin';
    // All other roles (Requester, Approver_Safety, Approver_AreaManager) get supervisor dashboard
    return 'supervisor';
  };

  const frontendRole = getFrontendRole(currentUser.role);

  // Render the correct page based on currentPage and role
  const renderPage = () => {
    console.log('📄 Rendering page:', currentPage, 'Role:', frontendRole);

    // Show profile page if requested
    if (showProfile) {
      return (
        <div className="max-w-4xl p-6 mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setShowProfile(false)}
              className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              ← Back to Dashboard
            </button>
          </div>
          <UserProfile user={currentUser} variant="full" />
        </div>
      );
    }

    // Admin pages
    if (frontendRole === 'admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard onNavigate={handleNavigate} />;
        
        case 'site-management':
          return <SiteManagement />;
        
        case 'user-management':
          return <UserManagement />;
        
        case 'all-permits':
          return (
            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">All Permits</h2>
              <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">All Permits View</h3>
                  <p className="text-gray-600">
                    Comprehensive permit management interface coming soon. This will include filtering, 
                    search, and detailed permit views.
                  </p>
                </div>
              </div>
            </div>
          );
        
        default:
          return <AdminDashboard onNavigate={handleNavigate} />;
      }
    }

    // Supervisor pages
    if (frontendRole === 'supervisor') {
      switch (currentPage) {
        case 'dashboard':
          return <SupervisorDashboard />;
        
        case 'create-ptw':
          return (
            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Create New Permit</h2>
              <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Create Permit Form</h3>
                  <p className="text-gray-600">
                    Multi-step permit creation form coming soon. This will include work details, 
                    hazard identification, PPE selection, and signature collection.
                  </p>
                </div>
              </div>
            </div>
          );
        
        case 'worker-list':
          return (
            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Worker List</h2>
              <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Worker Management</h3>
                  <p className="text-gray-600">
                    Worker list and assignment interface coming soon. This will include worker profiles, 
                    contact information, and permit assignments.
                  </p>
                </div>
              </div>
            </div>
          );
        
        default:
          return <SupervisorDashboard />;
      }
    }

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Unknown Role</h2>
          <p className="mt-2 text-gray-600">Please contact your administrator.</p>
        </div>
      </div>
    );
  };

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* Sidebar */}
        <Sidebar 
          currentUser={currentUser}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
          {/* Header */}
          <Header 
            currentUser={currentUser}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onLogout={handleLogout}
          />

          {/* User Profile Banner (shows when not on profile page) */}
          {!showProfile && (
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between mx-auto max-w-7xl">
                <UserProfile user={currentUser} variant="inline" />
                <button
                  onClick={() => setShowProfile(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 transition-colors border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-slate-50">
            {renderPage()}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;