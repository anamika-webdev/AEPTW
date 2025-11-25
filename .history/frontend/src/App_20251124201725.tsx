import React, { useState } from 'react';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

// User interface that matches backend response
interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string; // Database role: Admin, Approver_Safety, Approver_AreaManager, Requester
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker'; // Mapped role for UI
  department?: string;
  signature_url?: string;
  created_at?: string;
}

// Role Mapping Function
function mapDatabaseRoleToFrontend(dbRole: string): 'Admin' | 'Supervisor' | 'Worker' {
  // Map all roles to Supervisor except Admin
  if (dbRole === 'Admin') {
    return 'Admin';
  }
  // Approver_Safety, Approver_AreaManager, Requester all map to Supervisor
  return 'Supervisor';
}

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
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = (user: User) => {
    // Map the database role to frontend role
    const mappedUser: User = {
      ...user,
      frontendRole: mapDatabaseRoleToFrontend(user.role)
    };
    
    setCurrentUser(mappedUser);
    
    // Set initial page based on MAPPED role
    if (mappedUser.frontendRole === 'Admin') {
      setCurrentPage('admin-dashboard');
    } else {
      // Everyone else gets Supervisor dashboard
      setCurrentPage('supervisor-dashboard');
    }
    
    console.log('User logged in:', {
      name: mappedUser.full_name,
      databaseRole: user.role,
      frontendRole: mappedUser.frontendRole,
      initialPage: mappedUser.frontendRole === 'Admin' ? 'admin-dashboard' : 'supervisor-dashboard'
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    console.log('Navigating to:', page);
  };

  // Render dashboard based on current page and user role
  const renderDashboard = () => {
    const frontendRole = currentUser?.frontendRole;
    
    console.log('Rendering dashboard:', { 
      currentPage, 
      frontendRole,
      databaseRole: currentUser?.role 
    });
    
    // Admin Dashboard Routes
    if (frontendRole === 'Admin') {
      if (currentPage === 'admin-dashboard' || currentPage === 'all-permits' || 
          currentPage === 'site-management' || currentPage === 'user-management') {
        return <AdminDashboard currentPage={currentPage} onNavigate={handleNavigate} />;
      }
      // Default for admin
      return <AdminDashboard currentPage="admin-dashboard" onNavigate={handleNavigate} />;
    }
    
    // Supervisor Dashboard Routes (for all non-admin users)
    if (frontendRole === 'Supervisor') {
      if (currentPage === 'supervisor-dashboard' || currentPage === 'create-permit' || 
          currentPage === 'worker-list') {
        return <SupervisorDashboard />;
      }
      // Default for supervisor
      return <SupervisorDashboard />;
    }
    
    // Fallback
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Welcome to Amazon EPTW</h1>
          <div className="p-6 space-y-4 bg-white rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <span className="text-xl font-semibold text-blue-600">
                  {currentUser?.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{currentUser?.full_name}</p>
                <p className="text-sm text-gray-600">{currentUser?.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Database Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentUser?.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dashboard Access</dt>
                  <dd className="mt-1 text-sm text-gray-900">{frontendRole}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentUser?.department || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Login ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentUser?.login_id}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {!currentUser ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar
              currentUser={currentUser}
              currentPage={currentPage}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              isMobileMenuOpen={isMobileMenuOpen}
              onMobileMenuClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
              {/* Header */}
              <Header
                currentUser={currentUser}
                onMenuClick={() => setIsMobileMenuOpen(true)}
                onLogout={handleLogout}
              />

              {/* Dashboard Content */}
              <main className="flex-1 overflow-y-auto bg-slate-50">
                {renderDashboard()}
              </main>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}

export default App;