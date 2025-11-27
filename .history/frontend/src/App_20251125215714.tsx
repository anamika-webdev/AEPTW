// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteManagement from './pages/admin/SiteManagement';
import UserManagement from './pages/admin/UserManagement';
import AllPermits from './pages/admin/AllPermits';

// Supervisor Pages
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import CreatePTW from './pages/supervisor/CreatePTW';
import WorkerList from './pages/supervisor/WorkerList';

// Common Components
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
  | 'worker-list'
  | 'profile';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    sessionStorage.clear();
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  // Handle navigation
  const handleNavigate = (page: string) => {
    console.log('🚀 Navigating to:', page);
    setCurrentPage(page as PageType);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  // If not logged in, show auth pages
  if (!currentUser) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
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
    if (currentPage === 'profile') {
      return (
        <div className="max-w-4xl p-6 mx-auto">
          <div className="mb-6">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              ← Back to Dashboard
            </button>
          </div>
          <UserProfile user={currentUser} variant="card" />
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
          return <AllPermits />;
        
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
          return <CreatePTW />;
        
        case 'worker-list':
          return <WorkerList />;
        
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
        {currentPage !== 'profile' && currentPage !== 'create-ptw' && (
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mx-auto max-w-7xl">
              <UserProfile user={currentUser} variant="inline" />
              <button
                onClick={() => handleNavigate('profile')}
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
  );
}

export default App;