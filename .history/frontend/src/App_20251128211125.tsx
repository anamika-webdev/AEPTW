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
import { CreatePTW } from './components/supervisor/CreatePTW';
import { WorkerList } from './components/supervisor/WorkerList';

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
    
    console.log('🔄 App mounting, checking localStorage...');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ User loaded from localStorage:', {
          id: user.id,
          login_id: user.login_id,
          role: user.role,
          full_name: user.full_name
        });
        setCurrentUser(user);
      } catch (error) {
        console.error('❌ Failed to parse user from localStorage:', error);
        handleLogout();
      }
    } else {
      console.log('⚠️ No token or user in localStorage');
    }
  }, []);

  // Handle login
  const handleLogin = (user: User) => {
    console.log('✅ Login successful, user:', {
      id: user.id,
      login_id: user.login_id,
      role: user.role,
      full_name: user.full_name
    });
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    console.log('🚪 Logging out...');
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
    console.log('🔒 No user, showing login page');
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
  const getFrontendRole = (dbRole: string): 'admin' | 'supervisor' | 'worker' => {
    if (dbRole === 'Admin') return 'admin';
    if (dbRole === 'Requester') return 'worker';
    // Approver_Safety, Approver_AreaManager, or any other role → supervisor
    return 'supervisor';
  };

  const frontendRole = getFrontendRole(currentUser.role);
  
  console.log('🔐 User role mapping:', {
    databaseRole: currentUser.role,
    frontendRole: frontendRole,
    userId: currentUser.id,
    currentPage: currentPage
  });

  // Render the correct page based on role
  const renderPage = () => {
    console.log('📄 Rendering page:', currentPage, 'for role:', frontendRole);

    // Admin pages
    if (frontendRole === 'admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard />;
        
        case 'site-management':
          return <SiteManagement />;
        
        case 'user-management':
          return <UserManagement />;
        
        case 'all-permits':
          return <AllPermits />;
        
        default:
          return <AdminDashboard />;
      }
    }

    // Supervisor pages
    if (frontendRole === 'supervisor') {
      switch (currentPage) {
        case 'dashboard':
          return <SupervisorDashboard onNavigate={handleNavigate} />;
        
        case 'create-permit':
          return <CreatePTW onBack={() => handleNavigate('dashboard')} onSuccess={() => handleNavigate('dashboard')} />;
        
        case 'worker-list':
          return <WorkerList onBack={() => handleNavigate('dashboard')} />;
        
        default:
          return <SupervisorDashboard onNavigate={handleNavigate} />;
      }
    }

    // Worker pages - same as supervisor for now
    if (frontendRole === 'worker') {
      console.log('👷 Rendering worker dashboard');
      switch (currentPage) {
        case 'dashboard':
          return <SupervisorDashboard onNavigate={handleNavigate} />;
        
        case 'create-permit':
          return <CreatePTW onBack={() => handleNavigate('dashboard')} onSuccess={() => handleNavigate('dashboard')} />;
        
        case 'worker-list':
          return <WorkerList onBack={() => handleNavigate('dashboard')} />;
        
        default:
          return <SupervisorDashboard onNavigate={handleNavigate} />;
      }
    }

    // Fallback for unknown roles
    console.error('❌ Unknown role:', frontendRole);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Unknown Role</h2>
          <p className="mt-2 text-gray-600">Role: {currentUser.role}</p>
          <p className="mt-1 text-gray-600">Frontend Role: {frontendRole}</p>
          <p className="mt-4 text-sm text-gray-500">Please contact your administrator.</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Logout
          </button>
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
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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