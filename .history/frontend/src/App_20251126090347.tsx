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
import CreatePermit from './pages/supervisor/CreatePermit';
import WorkerList from './pages/supervisor/WorkerList';

// Common Components
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';

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
  | 'create-permit'
  | 'worker-list';

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
    setIsMobileMenuOpen(false);
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
    return 'supervisor';
  };

  const frontendRole = getFrontendRole(currentUser.role);

  // Render the correct page
  const renderPage = () => {
    console.log('📄 Rendering page:', currentPage, 'Role:', frontendRole);

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
          return <SupervisorDashboard onNavigate={handleNavigate} />;
        
        case 'create-permit':
          return <CreatePermit onBack={() => handleNavigate('dashboard')} />;
        
        case 'worker-list':
          return <WorkerList />;
        
        default:
          return <SupervisorDashboard onNavigate={handleNavigate} />;
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
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
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-56">
        {/* Header with profile dropdown */}
        <Header 
          currentUser={currentUser}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;